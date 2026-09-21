"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { LivePreview } from "./live-preview";
import { errorKindLabels, studioPost, StudioError, type ItemRow } from "./studio-data";
import { errorKinds } from "@/lib/error-kinds";
import { learningVerbs } from "@/lib/learning-events";
import { learningBands, type LearningBandId } from "@/lib/learning-bands";
import { reviewStatuses } from "@/lib/catalogue/model";
import type { ContentDistractor, ReviewStatus } from "@/lib/catalogue/model";

const phases = ["discover", "guided", "independent", "transfer"] as const;

/**
 * One item, editable, next to the child's view of it.
 *
 * The editing state is a local copy. An author types, sees the preview move, and
 * decides — nothing reaches the catalogue until Save, and nothing reaches a child until
 * the item is published *and* the catalogue is published. Two gates, both visible on
 * this screen, because the whole risk of handing authoring to a non-developer is
 * somebody not knowing which of their words are live.
 *
 * Mounted with `key={item.id}`, so opening a different item starts a new form rather
 * than resetting this one from an effect.
 */
export function ItemEditor({ item, onClose, onSaved }: {
  item: ItemRow;
  onClose: () => void;
  onSaved: (item: ItemRow) => void;
}) {
  const [draft, setDraft] = useState<ItemRow>(item);
  const [band, setBand] = useState<LearningBandId>(item.bands[0] ?? "prek");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(item), [draft, item]);

  function patch(change: Partial<ItemRow>) {
    setDraft((current) => ({ ...current, ...change }));
    setSaved(false);
  }
  function patchDistractor(index: number, change: Partial<ContentDistractor>) {
    setDraft((current) => ({
      ...current,
      distractors: current.distractors.map((distractor, at) => (at === index ? { ...distractor, ...change } : distractor)),
    }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      // The delivery block keeps the option order, so a renamed distractor does not
      // silently reshuffle the choices a child has already learnt the shape of.
      const options = [draft.answer, ...draft.distractors.map((distractor) => distractor.value)].filter(Boolean);
      const payload = { ...draft, delivery: { ...draft.delivery, options } };
      await studioPost("save-item", { item: payload });
      onSaved(payload as ItemRow);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "That could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="editor" aria-label={`Editing ${draft.id}`}>
      <header className="editor-bar">
        <div>
          <span className="studio-eyebrow">ITEM</span>
          <h2>{draft.id}</h2>
          <small>{draft.skillId} · {draft.lessonId} · {draft.source}</small>
        </div>
        <div className="editor-bar-actions">
          <button type="button" className="studio-button subtle only-compact" aria-pressed={mobilePreview} onClick={() => setMobilePreview((on) => !on)}>
            <Eye size={15}/>{mobilePreview ? "Edit" : "Preview"}
          </button>
          <button type="button" className="studio-button primary" disabled={saving || !dirty} onClick={save}>
            {saving ? <Loader2 size={15} className="studio-spin"/> : <Save size={15}/>}
            {dirty ? "Save item" : saved ? "Saved" : "No changes"}
          </button>
          <button type="button" className="studio-icon" aria-label="Close the editor" onClick={onClose}><X size={18}/></button>
        </div>
      </header>

      {error && <p className="studio-alert" role="alert">{error}</p>}
      {saved && !dirty && (
        <p className="studio-note is-good" role="status">
          <Check size={15}/>Saved to the working set. Children see it after the next publish.
        </p>
      )}

      <div className={`editor-split${mobilePreview ? " show-preview" : ""}`}>
        <div className="editor-form">
          <label className="studio-field">
            <span>Prompt <small>what the child is asked</small></span>
            <textarea
              value={draft.prompt.en ?? ""}
              rows={2}
              onChange={(event) => patch({ prompt: { ...draft.prompt, en: event.target.value } })}
            />
          </label>

          <div className="studio-row">
            <label className="studio-field">
              <span>Answer</span>
              <input value={draft.answer} onChange={(event) => patch({ answer: event.target.value })}/>
            </label>
            <label className="studio-field">
              <span>Learning verb <small>what the child does</small></span>
              <select value={draft.verb} onChange={(event) => patch({ verb: event.target.value as ItemRow["verb"] })}>
                {learningVerbs.map((verb) => <option key={verb} value={verb}>{verb}</option>)}
              </select>
            </label>
          </div>

          <div className="studio-row">
            <label className="studio-field">
              <span>Phase <small>gradual release</small></span>
              <select value={draft.phase} onChange={(event) => patch({ phase: event.target.value as ItemRow["phase"] })}>
                {phases.map((phase) => <option key={phase} value={phase}>{phase}</option>)}
              </select>
            </label>
            <label className="studio-field">
              <span>Review status <small>only published is served</small></span>
              <select
                value={draft.reviewStatus}
                data-status={draft.reviewStatus}
                onChange={(event) => patch({ reviewStatus: event.target.value as ReviewStatus })}
              >
                {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>

          <fieldset className="studio-field">
            <legend>Offered to <small>a band whose word budget this prompt fits</small></legend>
            <div className="band-checks">
              {learningBands.map((option) => (
                <label key={option.id} className={draft.bands.includes(option.id) ? "is-on" : ""}>
                  <input
                    type="checkbox"
                    checked={draft.bands.includes(option.id)}
                    onChange={(event) => patch({
                      bands: event.target.checked
                        ? [...draft.bands, option.id]
                        : draft.bands.filter((value) => value !== option.id),
                    })}
                  />
                  <span>{option.ageLabel}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/*
            The §C3 work, and the reason this editor exists at all. Every wrong answer
            gets a reason and a person's yes, because the teaching move a child receives
            branches on exactly this field.
          */}
          <fieldset className="studio-field">
            <legend>Wrong answers <small>and why a child picks each one</small></legend>
            <div className="distractors">
              {draft.distractors.map((distractor, index) => (
                <div key={index} className={`distractor${distractor.reviewed ? " is-reviewed" : ""}`}>
                  <input
                    aria-label={`Wrong answer ${index + 1}`}
                    value={distractor.value}
                    onChange={(event) => patchDistractor(index, { value: event.target.value })}
                  />
                  <select
                    aria-label={`Why a child picks ${distractor.value || "this"}`}
                    value={distractor.errorKind ?? ""}
                    onChange={(event) => patchDistractor(index, {
                      errorKind: (event.target.value || null) as ContentDistractor["errorKind"],
                      // Choosing a reason by hand is the act that makes it a person's
                      // decision. Nothing else in the product sets `reviewed`.
                      reviewed: event.target.value ? true : distractor.reviewed,
                    })}
                  >
                    <option value="">No reason yet</option>
                    {errorKinds.map((kind) => (
                      <option key={kind} value={kind}>{errorKindLabels[kind]}</option>
                    ))}
                  </select>
                  <input
                    aria-label={`Note about ${distractor.value || "this wrong answer"}`}
                    placeholder="Note for other authors (never shown to a child)"
                    value={distractor.note ?? ""}
                    onChange={(event) => patchDistractor(index, { note: event.target.value })}
                  />
                  <button
                    type="button"
                    className="studio-icon"
                    aria-label={`Remove wrong answer ${distractor.value || index + 1}`}
                    onClick={() => patch({ distractors: draft.distractors.filter((_, at) => at !== index) })}
                  >
                    <Trash2 size={15}/>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="studio-button subtle"
              onClick={() => patch({ distractors: [...draft.distractors, { value: "", errorKind: null, reviewed: false, note: "" }] })}
            >
              <Plus size={15}/>Add a wrong answer
            </button>
          </fieldset>

          <div className="studio-row">
            <label className="studio-field">
              <span>Hint <small>Nova&apos;s first help</small></span>
              <textarea rows={2} value={draft.hint.en ?? ""} onChange={(event) => patch({ hint: { ...draft.hint, en: event.target.value } })}/>
            </label>
            <label className="studio-field">
              <span>Explanation <small>said after a correct answer</small></span>
              <textarea rows={2} value={draft.explanation.en ?? ""} onChange={(event) => patch({ explanation: { ...draft.explanation, en: event.target.value } })}/>
            </label>
          </div>
        </div>

        <aside className="editor-preview">
          <div className="editor-preview-head">
            <span className="studio-eyebrow">AS THE CHILD SEES IT</span>
            <p>Answering here changes nothing. No event is recorded.</p>
          </div>
          <LivePreview item={draft} band={band} onBand={setBand}/>
        </aside>
      </div>
    </section>
  );
}
