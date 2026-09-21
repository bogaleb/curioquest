"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { ItemEditor } from "./item-editor";
import {
  errorKindLabels, statusLabels, studioGet, studioPost, StudioError,
  type ItemRow, type LessonRow, type SkillRow,
} from "./studio-data";
import { reviewStatuses } from "@/lib/catalogue/model";
import type { ReviewStatus } from "@/lib/catalogue/model";

/**
 * Skills, then lessons, then items — the §C4 hierarchy, walked the way an author thinks
 * about it. A flat list of 523 items is a database export, not an authoring surface.
 *
 * Filtering happens in Postgres rather than in the browser. The studio is one screen
 * over a catalogue that is meant to grow, and a client-side filter over a fetched page
 * is a filter that quietly stops being true.
 */
export function CatalogueBrowser({ onChanged }: { onChanged: () => void }) {
  const [skills, setSkills] = useState<SkillRow[] | null>(null);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [items, setItems] = useState<ItemRow[] | null>(null);
  const [skillId, setSkillId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [open, setOpen] = useState<ItemRow | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    studioGet<SkillRow[]>("skills").then(setSkills).catch((cause) => setError(String(cause.message)));
  }, []);

  const loadItems = useCallback(async () => {
    setPending(true);
    setError("");
    try {
      setItems(await studioGet<ItemRow[]>("items", {
        skillId, lessonId, status, search, unreviewedReasons: unreviewedOnly, limit: 120,
      }));
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "The item list could not be loaded.");
    } finally {
      setPending(false);
    }
  }, [skillId, lessonId, status, search, unreviewedOnly]);

  useEffect(() => {
    // A search box that fires per keystroke turns an author's typing into a hundred
    // queries. A short settle is the difference between responsive and hostile.
    const timer = setTimeout(loadItems, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadItems, search]);

  /**
   * Choosing a skill is something an author did, not state to be synchronised, so the
   * lesson list is fetched from the handler rather than from an effect watching it.
   */
  function chooseSkill(next: string) {
    setSkillId(next);
    setLessonId("");
    setLessons([]);
    if (next) studioGet<LessonRow[]>("lessons", { skillId: next }).then(setLessons).catch(() => setLessons([]));
  }

  /** Move a whole filtered selection through the review ladder in one action. */
  async function setStatusFor(ids: string[], next: ReviewStatus) {
    if (!ids.length) return;
    setBusy(true);
    setError("");
    try {
      await studioPost("set-status", { ids, status: next });
      setItems((current) => current?.map((item) => (ids.includes(item.id) ? { ...item, reviewStatus: next } : item)) ?? null);
      onChanged();
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "That status change did not save.");
    } finally {
      setBusy(false);
    }
  }

  if (open) {
    return (
      <ItemEditor
        // Keyed by id: opening a different item is a different form, and the editor's
        // draft state should start from that item rather than be reset into it.
        key={open.id}
        item={open}
        onClose={() => setOpen(null)}
        onSaved={(saved) => {
          setItems((current) => current?.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)) ?? null);
          setOpen(saved);
          onChanged();
        }}
      />
    );
  }

  return (
    <div className="browser">
      <div className="studio-filters" role="search">
        <label className="studio-search">
          <Search size={16} aria-hidden="true"/>
          <input
            type="search"
            placeholder="Search prompts and ids"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search prompts and item ids"
          />
        </label>
        <label className="studio-select">
          <span>Skill</span>
          <select value={skillId} onChange={(event) => chooseSkill(event.target.value)}>
            <option value="">Every skill</option>
            {(skills ?? []).map((skill) => (
              <option key={skill.id} value={skill.id}>{skill.subject} · {skill.name} ({skill.itemCount})</option>
            ))}
          </select>
        </label>
        <label className="studio-select">
          <span>Lesson</span>
          <select value={lessonId} disabled={!skillId} onChange={(event) => setLessonId(event.target.value)}>
            <option value="">Every lesson</option>
            {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} ({lesson.itemCount})</option>)}
          </select>
        </label>
        <label className="studio-select">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Any status</option>
            {reviewStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </select>
        </label>
        <label className={`studio-toggle${unreviewedOnly ? " is-on" : ""}`}>
          <input type="checkbox" checked={unreviewedOnly} onChange={(event) => setUnreviewedOnly(event.target.checked)}/>
          <SlidersHorizontal size={15} aria-hidden="true"/>
          <span>Wrong answers still to explain</span>
        </label>
      </div>

      {error && <p className="studio-alert" role="alert">{error}</p>}

      <div className="studio-bulk" aria-live="polite">
        <span>
          {pending ? "Loading…" : `${items?.length ?? 0} item${items?.length === 1 ? "" : "s"}`}
          {items && items.length === 120 && " (first 120)"}
        </span>
        <div>
          {reviewStatuses.map((value) => (
            <button
              key={value}
              type="button"
              className="studio-button subtle"
              disabled={busy || !items?.length}
              onClick={() => setStatusFor((items ?? []).filter((item) => item.reviewStatus !== value).map((item) => item.id), value)}
            >
              Mark all {statusLabels[value].toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {items === null ? (
        <p className="studio-loading"><Loader2 size={18} className="studio-spin"/>Reading the catalogue…</p>
      ) : items.length === 0 ? (
        <p className="studio-empty">Nothing matches those filters yet.</p>
      ) : (
        <ul className="item-list">
          {items.map((item, index) => (
            <li key={item.id} style={{ "--row": index } as React.CSSProperties}>
              <button type="button" onClick={() => setOpen(item)}>
                <span className={`status-dot status-${item.reviewStatus}`} aria-hidden="true"/>
                <span className="item-main">
                  <strong>{item.prompt.en || item.id}</strong>
                  <small>
                    {item.id} · {item.verb} · {item.phase} · {item.bands.length} band{item.bands.length === 1 ? "" : "s"}
                  </small>
                </span>
                <span className="item-side">
                  <em className={`status-chip status-${item.reviewStatus}`}>{statusLabels[item.reviewStatus]}</em>
                  {item.unreviewedReasons > 0 && (
                    <em className="status-chip is-pending" title={errorKindLabels.unexplained}>
                      {item.unreviewedReasons} to explain
                    </em>
                  )}
                </span>
                <ChevronRight size={17} aria-hidden="true"/>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
