"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { studioPost, StudioError } from "./studio-data";

const EXAMPLE = `{
  "skills": [],
  "lessons": [
    {
      "id": "counting-to-five",
      "skillId": "math-counting-1",
      "title": "Counting to five",
      "childTitle": "Count with me",
      "position": 1,
      "reviewStatus": "draft"
    }
  ],
  "items": [
    {
      "id": "counting-to-five-1",
      "lessonId": "counting-to-five",
      "skillId": "math-counting-1",
      "verb": "say",
      "phase": "guided",
      "bands": ["prek", "kindergarten"],
      "prompt": { "en": "How many apples?" },
      "hint": { "en": "Touch each apple and count out loud." },
      "explanation": { "en": "Three apples. You counted every one." },
      "answer": "3",
      "distractors": [
        { "value": "2", "errorKind": "off-by-one", "reviewed": true },
        { "value": "4", "errorKind": "off-by-one", "reviewed": true }
      ],
      "delivery": {
        "activityType": "count",
        "subject": "math",
        "grade": "prek",
        "level": 1,
        "estimatedMinutes": 1,
        "contextTags": [],
        "visual": "🍎🍎🍎"
      },
      "reviewStatus": "draft"
    }
  ]
}`;

/**
 * Bulk import (§WP-05.3).
 *
 * JSON rather than a spreadsheet upload, because the content model has nested shapes —
 * a distractor carries a reason and a note — that a flat grid cannot hold without
 * inventing a second encoding for authors to learn and for the product to get wrong.
 *
 * Everything imported arrives as `draft` unless it says otherwise, and no import can
 * publish. That is what makes handing this box to somebody safe: the worst outcome of a
 * bad paste is work to undo, never a child seeing it.
 */
export function ImportPanel({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /** Shape-check in the browser, so a typo is caught before a round trip. */
  type Parsed = { error: string } | { counts: { skills: number; lessons: number; items: number }; total: number };
  const parsed = useMemo<Parsed | null>(() => {
    if (!text.trim()) return null;
    try {
      const value = JSON.parse(text) as Record<string, unknown>;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { error: "The top level has to be an object with skills, lessons or items." };
      }
      const counts = {
        skills: Array.isArray(value.skills) ? value.skills.length : 0,
        lessons: Array.isArray(value.lessons) ? value.lessons.length : 0,
        items: Array.isArray(value.items) ? value.items.length : 0,
      };
      const total = counts.skills + counts.lessons + counts.items;
      if (!total) return { error: "Nothing to import: skills, lessons and items are all empty." };
      if (total > 2000) return { error: `${total} rows is over the 2000-row limit for one batch.` };
      return { counts, total };
    } catch (cause) {
      return { error: `That is not valid JSON — ${(cause as Error).message}` };
    }
  }, [text]);

  async function run() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await studioPost<{ imported: number }>("import", JSON.parse(text));
      setMessage(`${result.imported} row${result.imported === 1 ? "" : "s"} imported as working-set content. Nothing is served until you publish.`);
      setText("");
      onImported();
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "The import did not run.");
    } finally {
      setBusy(false);
    }
  }

  async function fromFile(file: File) {
    setError("");
    setMessage("");
    setText(await file.text());
  }

  return (
    <section className="studio-card import">
      <header>
        <span className="studio-eyebrow">BULK IMPORT</span>
        <h2>Add a lesson without a deploy</h2>
        <p>
          Paste a batch of skills, lessons and items. The whole batch lands or none of it does,
          so you are never left working out which half arrived. Everything imports as draft.
        </p>
      </header>

      <div className="import-actions">
        <label className="studio-button subtle import-file">
          <FileUp size={15}/>Choose a JSON file
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => { const file = event.target.files?.[0]; if (file) void fromFile(file); }}
          />
        </label>
        <button type="button" className="studio-button subtle" onClick={() => setText(EXAMPLE)}>Fill in an example</button>
      </div>

      <label className="studio-field">
        <span>Content JSON</span>
        <textarea
          className="import-text"
          rows={16}
          spellCheck={false}
          value={text}
          placeholder={EXAMPLE}
          onChange={(event) => setText(event.target.value)}
        />
      </label>

      {parsed && "error" in parsed && <p className="studio-alert" role="alert"><AlertTriangle size={16}/>{parsed.error}</p>}
      {parsed && "counts" in parsed && (
        <p className="studio-note" role="status">
          Ready: {parsed.counts.skills} skills, {parsed.counts.lessons} lessons, {parsed.counts.items} items.
        </p>
      )}
      {error && <p className="studio-alert" role="alert"><AlertTriangle size={16}/>{error}</p>}
      {message && <p className="studio-note is-good" role="status"><CheckCircle2 size={16}/>{message}</p>}

      <button
        type="button"
        className="studio-button primary"
        disabled={busy || !parsed || "error" in parsed}
        onClick={run}
      >
        {busy ? <Loader2 size={16} className="studio-spin"/> : <Upload size={16}/>}Import as draft
      </button>
    </section>
  );
}
