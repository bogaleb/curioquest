"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ChevronRight, Loader2, TriangleAlert } from "lucide-react";
import { ItemEditor } from "./item-editor";
import { errorKindLabels, studioGet, StudioError, type ItemRow } from "./studio-data";
import { itemVerdict, needsRewrite, DOMINANT_DISTRACTOR_SHARE, type ItemHealth as Health } from "@/lib/insights";

/**
 * Which items are badly written (blueprint §WP-06.2).
 *
 * The signal is the *shape* of the wrong answers, not their number. An item where
 * children pick all three distractors roughly equally is doing its job — they did not
 * know, and they guessed. An item where four in five wrong answers are the same one is
 * either indistinguishable from the answer or encoding a misconception the lesson never
 * taught, and no score would ever show it.
 *
 * Every row opens the real editor, because a flag an author cannot act on from where
 * they are standing is a flag they learn to scroll past.
 */
export function ItemHealthView({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<Health[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<ItemRow | null>(null);
  const [opening, setOpening] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(true);

  const load = useCallback(() => {
    studioGet<Health[]>("item-health")
      .then((next) => { setRows(next); setError(""); })
      .catch((cause) => setError(cause instanceof StudioError ? cause.message : "Item health could not be read."));
  }, []);

  useEffect(load, [load]);

  /** The health row names an item; the editor needs the item itself. */
  async function edit(itemId: string) {
    setOpening(itemId);
    setError("");
    try {
      setOpen(await studioGet<ItemRow>("item", { id: itemId }));
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "That item could not be opened.");
    } finally {
      setOpening("");
    }
  }

  if (open) {
    return (
      <ItemEditor
        key={open.id}
        item={open}
        onClose={() => { setOpen(null); load(); }}
        onSaved={(saved) => { setOpen(saved); onChanged(); }}
      />
    );
  }

  const flagged = rows ? needsRewrite(rows) : [];
  const shown = rows ? (onlyFlagged ? flagged : rows) : [];

  return (
    <div className="health">
      <section className="studio-card">
        <header>
          <span className="studio-eyebrow"><Activity size={13}/> ITEM HEALTH</span>
          <h2>
            {rows === null ? "Reading the evidence…"
              : flagged.length === 0 ? "No item is failing in a way the evidence can see"
              : `${flagged.length} item${flagged.length === 1 ? "" : "s"} to rewrite`}
          </h2>
          <p>
            Wrong answers spread across the choices mean a child did not know. Wrong answers
            piling onto <em>one</em> choice mean the item is teaching something nobody intended.
            An item is flagged when more than {Math.round(DOMINANT_DISTRACTOR_SHARE * 100)}% of its
            wrong answers land on the same distractor.
          </p>
        </header>

        {error && <p className="studio-alert" role="alert"><TriangleAlert size={16}/>{error}</p>}

        {rows !== null && (
          <label className={`studio-toggle${onlyFlagged ? " is-on" : ""}`}>
            <input type="checkbox" checked={onlyFlagged} onChange={(event) => setOnlyFlagged(event.target.checked)}/>
            <span>Only items over the line</span>
          </label>
        )}
      </section>

      {rows === null ? (
        <p className="studio-loading"><Loader2 size={18} className="studio-spin"/>Folding the event stream…</p>
      ) : shown.length === 0 ? (
        <p className="studio-empty">
          {rows.length === 0
            ? "No item has enough wrong answers yet to say anything honest about it."
            : "Nothing is over the line. Turn the filter off to see the whole distribution."}
        </p>
      ) : (
        <ul className="health-list">
          {shown.map((item, index) => {
            const verdict = itemVerdict(item);
            const accuracy = item.attempts ? item.correct / item.attempts : 0;
            return (
              <li key={item.itemId} className={`is-${verdict.kind}`} style={{ "--row": index } as React.CSSProperties}>
                <button type="button" disabled={!!opening} onClick={() => edit(item.itemId)}>
                  <span className="health-main">
                    <strong>{item.prompt || item.itemId}</strong>
                    <small>{item.itemId} · {item.skillId}</small>
                    <span className="health-verdict">{verdict.sentence}</span>
                  </span>

                  <span className="health-figures">
                    {/*
                      The distribution itself, not a number about it. One bar for the
                      dominant wrong answer against everything else, so "most of them" is
                      something an author sees rather than reads.
                    */}
                    <span
                      className="health-bar"
                      role="img"
                      aria-label={`${Math.round(item.share * 100)} percent of ${item.wrong} wrong answers chose ${item.topDistractor}`}
                    >
                      <span className="health-share" style={{ "--share": item.share } as React.CSSProperties}/>
                    </span>
                    <span className="health-numbers">
                      <b>{Math.round(item.share * 100)}%</b>
                      <small>on “{item.topDistractor}”</small>
                    </span>
                    <span className="health-meta">
                      <em>{item.wrong} wrong</em>
                      <em>{Math.round(accuracy * 100)}% right</em>
                      {item.errorKind
                        ? <em className={`status-chip${item.reviewed ? " status-published" : ""}`}>
                            {errorKindLabels[item.errorKind] ?? item.errorKind}
                          </em>
                        : <em className="status-chip is-pending">no reason written</em>}
                    </span>
                  </span>
                  {opening === item.itemId ? <Loader2 size={17} className="studio-spin"/> : <ChevronRight size={17} aria-hidden="true"/>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
