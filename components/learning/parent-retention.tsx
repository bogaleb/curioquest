"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Sprout } from "lucide-react";
import { skillById } from "@/lib/skill-graph";
import { describeRetention, emptyRetention, type Retention } from "@/lib/insights";

const WINDOWS = [7, 14, 30] as const;

/**
 * Did any of it stay? (blueprint §WP-06.3)
 *
 * The one question a session summary can never answer, and the one the product's whole
 * spaced-practice claim rests on. A child who got everything right on Tuesday and has
 * forgotten it by the following Tuesday has not learned it, and until now nothing in
 * the product could tell a parent that.
 *
 * Deliberately never a bare percentage. §D5 forbids dressing a practice signal as an
 * assessment, and "60%" with no denominator reads like a grade — so the headline is a
 * sentence, the counts are shown beside it, and a skill that has simply not come round
 * again yet is reported as waiting rather than folded into either column.
 */
export function ParentRetention({ profileId, name }: { profileId: string; name: string }) {
  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<Retention | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  /**
   * Nothing is set synchronously here: `busy` is derived from which window has come
   * back rather than from a flag the effect flips on its way in, which keeps the fetch
   * a synchronisation rather than a cascade of renders.
   */
  const load = useCallback((window: number, signal: AbortSignal) => {
    return fetch(`/api/parent/insights?profile=${encodeURIComponent(profileId)}&days=${window}`, {
      cache: "no-store",
      signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Learning records could not be read.");
        return body.retention as Retention;
      });
  }, [profileId]);

  useEffect(() => {
    const controller = new AbortController();
    load(days, controller.signal)
      .then((next) => { setData(next); setError(""); setLoaded(days); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Learning records could not be read.");
        setData(emptyRetention(days));
        setLoaded(days);
      });
    // A parent tapping through the windows must not have a slow first answer land on
    // top of a fast second one.
    return () => controller.abort();
  }, [load, days, attempt]);

  const busy = loaded !== days;
  const retention = data ?? emptyRetention(days);
  const seen = retention.skillsRevisited;
  const held = retention.skillsRetained;

  return (
    <section className="panel parent-retention">
      <div className="panel-title">
        <div>
          <span className="eyebrow">WHAT STAYED</span>
          <h2>{name}&apos;s memory over time</h2>
        </div>
        <Sprout size={25} aria-hidden="true"/>
      </div>

      <div className="retention-windows" role="group" aria-label="How long after learning to check">
        {WINDOWS.map((window) => (
          <button
            key={window}
            type="button"
            className={window === days ? "is-current" : ""}
            aria-pressed={window === days}
            disabled={busy}
            onClick={() => setDays(window)}
          >
            {window} days later
          </button>
        ))}
      </div>

      {error && <p className="error" role="alert">{error}<button className="secondary" disabled={busy} onClick={() => setAttempt((count) => count + 1)}>Try again</button></p>}

      <p className="retention-sentence" aria-live="polite">{describeRetention(retention, name)}</p>

      {seen > 0 && (
        <>
          {/*
            Two segments and a remainder: what held, what slipped, and what has not come
            round again yet. The third is the honest part — leaving it out would make a
            young account look far more certain than it is.
          */}
          <div
            className="retention-bar"
            role="img"
            aria-label={`${held} skills still there, ${seen - held} needed another look, ${retention.awaiting} not yet revisited`}
          >
            <span className="retention-held" style={{ "--share": held / Math.max(retention.skillsLearned, 1) } as React.CSSProperties}/>
            <span className="retention-slipped" style={{ "--share": (seen - held) / Math.max(retention.skillsLearned, 1) } as React.CSSProperties}/>
            <span className="retention-waiting" style={{ "--share": retention.awaiting / Math.max(retention.skillsLearned, 1) } as React.CSSProperties}/>
          </div>
          <ul className="retention-key">
            <li><em className="retention-dot is-held"/><strong>{held}</strong> still there</li>
            <li><em className="retention-dot is-slipped"/><strong>{seen - held}</strong> needed another look</li>
            <li><em className="retention-dot is-waiting"/><strong>{retention.awaiting}</strong> not due yet</li>
          </ul>
        </>
      )}

      {retention.slipped.length > 0 && (
        <div className="retention-slipped-list">
          <h3>Worth revisiting together</h3>
          <ul>
            {retention.slipped.slice(0, 6).map((entry) => (
              <li key={`${entry.skillId}:${entry.revisitedAt}`}>
                <strong>{skillById.get(entry.skillId)?.name ?? entry.skillId}</strong>
                <small>
                  first got it {new Date(entry.learnedAt).toLocaleDateString()}, needed help again{" "}
                  {new Date(entry.revisitedAt).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>
          <p className="form-note">
            Forgetting is ordinary and it is how spaced practice is supposed to work — a skill
            that slipped is one CurioQuest will bring back sooner, not a setback.
          </p>
        </div>
      )}

      <p className="form-note">
        <CalendarClock size={13} aria-hidden="true"/> Counted only from skills {name} has actually met
        again this long after first getting them right. Skills that have not come round yet are not
        counted either way. These are practice signals, not an assessment.
      </p>
    </section>
  );
}
