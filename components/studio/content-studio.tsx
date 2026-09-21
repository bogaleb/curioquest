"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, HelpCircle, LayoutGrid, Library, Loader2, Rocket, Upload,
} from "lucide-react";
import { CatalogueBrowser } from "./catalogue-browser";
import { ImportPanel } from "./import-panel";
import { PublishPanel } from "./publish-panel";
import { errorKindLabels, studioGet, StudioError, type Overview } from "./studio-data";

type View = "overview" | "catalogue" | "import" | "publish";

const VIEWS: { id: View; label: string; icon: typeof LayoutGrid; blurb: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, blurb: "What is live, and what is waiting" },
  { id: "catalogue", label: "Catalogue", icon: Library, blurb: "Skills, lessons and every item" },
  { id: "import", label: "Import", icon: Upload, blurb: "Add a batch without a deploy" },
  { id: "publish", label: "Publish", icon: Rocket, blurb: "Validate, ship, roll back" },
];

/**
 * The content studio.
 *
 * The screen is organised around the one question an author actually has — *is what I
 * wrote in front of a child yet?* — so the published version, the draft/reviewed/published
 * split and the publish action are visible from every view rather than filed under a tab.
 */
export function ContentStudio() {
  const [view, setView] = useState<View>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    studioGet<Overview>("overview")
      .then((next) => { setOverview(next); setError(""); })
      .catch((cause) => setError(cause instanceof StudioError ? cause.message : "The catalogue could not be read."));
  }, []);

  useEffect(refresh, [refresh]);

  const counts = overview?.counts;
  const total = counts ? Math.max(counts.items, 1) : 1;

  return (
    <div className="studio">
      <header className="studio-top">
        <div className="studio-brand">
          <Link className="studio-back" href="/today" aria-label="Back to CurioQuest"><ArrowLeft size={18}/></Link>
          <div>
            <span className="studio-eyebrow">CURIOQUEST</span>
            <h1>Content studio</h1>
          </div>
        </div>
        <div className="studio-live" aria-live="polite">
          {overview?.current ? (
            <>
              <span className="studio-live-dot" aria-hidden="true"/>
              <div>
                <strong>Live: v{overview.current.version}</strong>
                <small>{overview.current.itemCount} items · {overview.current.label}</small>
              </div>
            </>
          ) : (
            <div><strong>Nothing published</strong><small>Children are served the bundled bank</small></div>
          )}
        </div>
      </header>

      <nav className="studio-nav" aria-label="Studio sections">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={view === entry.id ? "is-current" : ""}
            aria-current={view === entry.id ? "page" : undefined}
            onClick={() => setView(entry.id)}
          >
            <entry.icon size={17} aria-hidden="true"/>
            <span><strong>{entry.label}</strong><small>{entry.blurb}</small></span>
          </button>
        ))}
      </nav>

      {error && <p className="studio-alert" role="alert">{error}</p>}

      <main className="studio-main">
        {view === "overview" && (
          !counts ? (
            <p className="studio-loading"><Loader2 size={18} className="studio-spin"/>Reading the catalogue…</p>
          ) : (
            <div className="overview">
              <section className="studio-card overview-gate">
                <header>
                  <span className="studio-eyebrow">THE GATE</span>
                  <h2>{counts.published} of {counts.items} items reach a child</h2>
                  <p>
                    Only <strong>published</strong> content is ever served. Draft and reviewed work is
                    invisible by construction, which is what makes this surface safe to hand to
                    somebody who is not a developer.
                  </p>
                </header>
                {/*
                  One bar rather than three numbers: the proportions are the point, and an
                  author should be able to see the backlog without doing arithmetic.
                */}
                <div className="gate-bar" role="img" aria-label={`${counts.published} published, ${counts.reviewed} reviewed, ${counts.draft} draft`}>
                  <span className="gate-published" style={{ "--share": counts.published / total } as React.CSSProperties}/>
                  <span className="gate-reviewed" style={{ "--share": counts.reviewed / total } as React.CSSProperties}/>
                  <span className="gate-draft" style={{ "--share": counts.draft / total } as React.CSSProperties}/>
                </div>
                <ul className="gate-key">
                  <li><em className="status-dot status-published"/><strong>{counts.published}</strong> published <small>served to children</small></li>
                  <li><em className="status-dot status-reviewed"/><strong>{counts.reviewed}</strong> reviewed <small>a person said yes</small></li>
                  <li><em className="status-dot status-draft"/><strong>{counts.draft}</strong> draft <small>still being written</small></li>
                </ul>
                <button type="button" className="studio-button" onClick={() => setView("catalogue")}>
                  <BookOpen size={15}/>Open the catalogue
                </button>
              </section>

              <div className="stat-grid">
                {[
                  { label: "Skills", value: counts.skills, note: `${counts.activeSkills} active` },
                  { label: "Lessons", value: counts.lessons, note: "one per skill and rung" },
                  { label: "Items", value: counts.items, note: `${counts.published} served` },
                  { label: "Wrong answers", value: counts.distractors, note: `${counts.noReason} with no reason yet` },
                  { label: "Assets", value: counts.assets, note: "audio and art" },
                  { label: "Episodes", value: counts.episodes, note: "story sequences" },
                ].map((stat, index) => (
                  <article key={stat.label} className="stat" style={{ "--row": index } as React.CSSProperties}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                    <small>{stat.note}</small>
                  </article>
                ))}
              </div>

              {/*
                The §C3 backlog, ranked by damage. A misconception that appears often is
                one whose teaching move is wrong often, so it is worth a person's attention
                before a rarer one.
              */}
              <section className="studio-card">
                <header>
                  <span className="studio-eyebrow"><HelpCircle size={13}/> WHY CHILDREN CHOOSE WRONG</span>
                  <h2>{counts.unreviewedReasons} wrong answers still need a person&apos;s decision</h2>
                  <p>
                    A machine&apos;s guess about why a child picked an answer is a starting position,
                    not authorship. Until somebody confirms it, the teaching move that child receives
                    is guesswork.
                  </p>
                </header>
                {overview.reasonQueue.length ? (
                  <ul className="reason-queue">
                    {overview.reasonQueue.map((row, index) => (
                      <li key={row.errorKind} style={{ "--row": index } as React.CSSProperties}>
                        <span className="reason-name">{errorKindLabels[row.errorKind] ?? row.errorKind}</span>
                        <span className="reason-track" aria-hidden="true">
                          <span style={{ "--share": row.pending / Math.max(overview.reasonQueue[0].pending, 1) } as React.CSSProperties}/>
                        </span>
                        <span className="reason-count">{row.pending} <small>of {row.total}</small></span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="studio-note is-good">Every wrong answer has a reason somebody chose.</p>
                )}
              </section>
            </div>
          )
        )}

        {view === "catalogue" && <CatalogueBrowser onChanged={refresh}/>}
        {view === "import" && <ImportPanel onImported={refresh}/>}
        {view === "publish" && <PublishPanel overview={overview} onPublished={refresh}/>}
      </main>
    </div>
  );
}
