"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, History, Loader2, Rocket, ShieldCheck, Undo2 } from "lucide-react";
import { studioPost, studioPublish, StudioError, type Overview, type ProblemLine, type ValidationReport } from "./studio-data";

/**
 * The gate between an author and every child using the product.
 *
 * Two deliberate choices. First, validation is offered *before* publishing rather than
 * only as a refusal — an author should be able to ask "what would this do" without
 * committing. Second, a refusal renders every sentence the validator produced, grouped
 * by the row to fix. "Publish failed" is the message this whole package exists to stop
 * somebody receiving.
 */
export function PublishPanel({ overview, onPublished }: {
  overview: Overview | null;
  onPublished: () => void;
}) {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [problems, setProblems] = useState<ProblemLine[] | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function validate() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await studioPost<ValidationReport>("validate");
      setReport(next);
      setProblems(next.problems);
      setMessage(next.publishable
        ? "Nothing blocks a publish."
        : `${next.errorCount} ${next.errorCount === 1 ? "problem blocks" : "problems block"} a publish.`);
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "The check could not run.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await studioPublish(label, notes);
      setProblems(result.problems);
      if (!result.ok) {
        setReport({ problems: result.problems, errorCount: result.problems.filter((p) => p.severity === "error").length, publishable: false });
        setError(result.message);
        return;
      }
      setReport({ problems: result.problems, errorCount: 0, publishable: true });
      setMessage(`Version ${result.version.version} is live: ${result.version.itemCount} items across ${result.version.skillCount} skills.`);
      setLabel("");
      setNotes("");
      onPublished();
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "The publish could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function rollback(version: number) {
    setBusy(true);
    setError("");
    try {
      await studioPost("rollback", { version });
      setMessage(`Children are being served version ${version} again.`);
      onPublished();
    } catch (cause) {
      setError(cause instanceof StudioError ? cause.message : "The rollback did not take.");
    } finally {
      setBusy(false);
    }
  }

  const errors = (problems ?? []).filter((problem) => problem.severity === "error");
  const warnings = (problems ?? []).filter((problem) => problem.severity === "warning");

  return (
    <div className="publish">
      <section className="studio-card publish-main">
        <header>
          <span className="studio-eyebrow">PUBLISH</span>
          <h2>Put this catalogue in front of children</h2>
          <p>
            Publishing takes every item marked <strong>published</strong>, validates the whole
            catalogue, and writes one immutable snapshot. Draft and reviewed work stays invisible.
          </p>
        </header>

        <div className="publish-fields">
          <label className="studio-field">
            <span>Name this version <small>optional; a timestamp is used otherwise</small></span>
            <input value={label} maxLength={120} placeholder="Pre-K prompts rewritten for three-year-olds" onChange={(event) => setLabel(event.target.value)}/>
          </label>
          <label className="studio-field">
            <span>Notes <small>what changed, and why</small></span>
            <textarea rows={2} value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)}/>
          </label>
        </div>

        <div className="publish-actions">
          <button type="button" className="studio-button" disabled={busy} onClick={validate}>
            {busy ? <Loader2 size={16} className="studio-spin"/> : <ShieldCheck size={16}/>}Check the whole catalogue
          </button>
          <button type="button" className="studio-button primary" disabled={busy || report?.publishable === false} onClick={publish}>
            <Rocket size={16}/>Publish
          </button>
        </div>

        {error && <p className="studio-alert" role="alert"><AlertTriangle size={16}/>{error}</p>}
        {message && <p className="studio-note is-good" role="status"><CheckCircle2 size={16}/>{message}</p>}

        {problems && (
          <div className="problem-report">
            {errors.length > 0 && (
              <>
                <h3>{errors.length} {errors.length === 1 ? "problem blocks" : "problems block"} this publish</h3>
                <ul className="problem-list is-errors">
                  {errors.map((problem, index) => (
                    <li key={index} style={{ "--row": index } as React.CSSProperties}>
                      <code>{problem.where}</code>
                      <span><strong>{problem.field}</strong> {problem.message}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {warnings.length > 0 && (
              <>
                <h3>{warnings.length} advisory {warnings.length === 1 ? "note" : "notes"}</h3>
                <p className="studio-hint">
                  These do not block a publish, and they are stored with the version so the
                  backlog stays countable rather than becoming invisible debt.
                </p>
                <ul className="problem-list">
                  {warnings.slice(0, 40).map((problem, index) => (
                    <li key={index} style={{ "--row": index } as React.CSSProperties}>
                      <code>{problem.where}</code>
                      <span><strong>{problem.field}</strong> {problem.message}</span>
                    </li>
                  ))}
                </ul>
                {warnings.length > 40 && <p className="studio-hint">and {warnings.length - 40} more.</p>}
              </>
            )}
            {!errors.length && !warnings.length && (
              <p className="studio-note is-good"><CheckCircle2 size={16}/>The catalogue is clean.</p>
            )}
          </div>
        )}
      </section>

      <section className="studio-card">
        <header>
          <span className="studio-eyebrow"><History size={13}/> HISTORY</span>
          <h2>Published versions</h2>
          <p>Each snapshot is immutable, so rolling back returns children to exactly what they were served — not an approximation of it.</p>
        </header>
        <ul className="version-list">
          {(overview?.versions ?? []).map((version, index) => (
            <li key={version.version} className={version.isCurrent ? "is-current" : ""} style={{ "--row": index } as React.CSSProperties}>
              <span className="version-main">
                <strong>v{version.version} · {version.label}</strong>
                <small>
                  {version.itemCount} items · {new Date(version.publishedAt).toLocaleString()}
                </small>
              </span>
              {version.isCurrent ? (
                <em className="status-chip status-published">Live</em>
              ) : (
                <button type="button" className="studio-button subtle" disabled={busy} onClick={() => rollback(version.version)}>
                  <Undo2 size={14}/>Roll back to this
                </button>
              )}
            </li>
          ))}
          {!overview?.versions.length && <li className="studio-empty">Nothing has been published yet.</li>}
        </ul>
      </section>
    </div>
  );
}
