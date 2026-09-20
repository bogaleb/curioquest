"use client";

import { useMemo, useState } from "react";
import { Clock, Compass, Sparkles, TrendingUp } from "lucide-react";
import { buildReports, focusSuggestion, type ReportPeriod } from "@/lib/reports";
import { achievementSummary } from "@/lib/achievements";
import type { PublicExplorer } from "@/lib/explorer-view";

const PERIODS: ReportPeriod[] = ["today", "week", "month"];

/**
 * Parent progress reports.
 *
 * Plain language, real counts. Where there is no activity the report says so rather
 * than showing a zero that reads like failure, and the independent rate is always
 * presented next to the counts it came from so it cannot be mistaken for a grade.
 */
export function ParentReports({ profile }: { profile: PublicExplorer }) {
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const reports = useMemo(() => buildReports(profile), [profile]);
  const report = reports[period];
  const advice = focusSuggestion(report);
  const awards = useMemo(() => achievementSummary(profile), [profile]);

  return (
    <section className="panel cq-report" aria-labelledby="cq-report-title">
      <div className="cq-report-head">
        <div>
          <h2 id="cq-report-title">{profile.name}&rsquo;s progress</h2>
          <p>Counted from real activity. These are practice signals, not a grade.</p>
        </div>
        <div className="cq-report-tabs" role="tablist" aria-label="Reporting period">
          {PERIODS.map((option) => (
            <button
              key={option}
              role="tab"
              type="button"
              aria-selected={period === option}
              className={period === option ? "is-active" : ""}
              onClick={() => setPeriod(option)}
            >
              {reports[option].label}
            </button>
          ))}
        </div>
      </div>

      {report.empty ? (
        <div className="cq-report-empty">
          <Compass size={32} aria-hidden="true" />
          <div>
            <strong>No practice recorded {report.label.toLowerCase()}.</strong>
            <p>
              That is completely fine. Learning does not have to happen every day, and
              nothing is lost by taking a break.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="cq-report-figures">
            <div className="cq-figure">
              <Sparkles size={20} aria-hidden="true" />
              <strong>{report.activities}</strong>
              <small>activities</small>
            </div>
            <div className="cq-figure">
              <Clock size={20} aria-hidden="true" />
              <strong>{report.minutes}</strong>
              <small>minutes</small>
            </div>
            <div className="cq-figure">
              <Compass size={20} aria-hidden="true" />
              <strong>{report.daysActive}</strong>
              <small>{report.daysActive === 1 ? "day" : "days"} explored</small>
            </div>
            <div className="cq-figure">
              <TrendingUp size={20} aria-hidden="true" />
              <strong>{report.independentRate}%</strong>
              <small>
                on their own ({report.independent} of {report.activities})
              </small>
            </div>
          </div>

          <h3>Where the time went</h3>
          <ul className="cq-report-subjects">
            {report.subjects
              .filter((subject) => subject.activities > 0)
              .map((subject) => {
                const share = Math.round((subject.activities / report.activities) * 100);
                return (
                  <li key={subject.subject} data-world={subject.subject}>
                    <div className="cq-report-subject-head">
                      <strong>{subject.world}</strong>
                      <span>
                        {subject.activities}{" "}
                        {subject.activities === 1 ? "activity" : "activities"}
                        {subject.skillsPractised > 0 && ` · ${subject.skillsPractised} skills`}
                      </span>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${share}%` }} />
                    </div>
                  </li>
                );
              })}
          </ul>

          {report.strongSkills.length > 0 && (
            <>
              <h3>Looking confident</h3>
              <div className="cq-chip-row">
                {report.strongSkills.map((name) => (
                  <span key={name} className="cq-chip is-strong">
                    {name}
                  </span>
                ))}
              </div>
            </>
          )}

          {report.growingSkills.length > 0 && (
            <>
              <h3>Still building</h3>
              <div className="cq-chip-row">
                {report.growingSkills.map((name) => (
                  <span key={name} className="cq-chip">
                    {name}
                  </span>
                ))}
              </div>
              <p className="form-note">
                These are skills with some practice behind them but not yet a settled
                pattern. CurioQuest will keep bringing them back.
              </p>
            </>
          )}

          {advice && <p className="cq-report-advice">{advice}</p>}
        </>
      )}

      <div className="cq-report-awards">
        <strong>
          {awards.earned} of {awards.total} awards earned
        </strong>
        {awards.subjectNames.length > 0 && (
          <span>Practised so far: {awards.subjectNames.join(", ")}.</span>
        )}
      </div>
    </section>
  );
}
