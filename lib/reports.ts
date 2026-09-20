import type { ExplorerProfile } from "./explorers";
import { progressionState } from "./mastery";
import { skillById, type SkillSubject } from "./skill-graph";
import { allSubjects, subjectMeta } from "./subjects";

/**
 * Parent progress reports.
 *
 * Every number here is counted from recorded activity. Nothing is modelled, estimated,
 * or scaled to look encouraging — if a week has no practice, the report says so. The
 * only derived figure is the independent rate, which is a plain ratio of activities
 * answered correctly first time without a hint, and it is always shown alongside the
 * counts it came from so a parent can see what it means.
 */

export type ReportPeriod = "today" | "week" | "month";

export type SubjectReport = {
  subject: SkillSubject;
  label: string;
  world: string;
  activities: number;
  /** Correct first time, with no hint. */
  independent: number;
  /** Distinct skills that received evidence in the period. */
  skillsPractised: number;
  minutes: number;
};

export type Report = {
  period: ReportPeriod;
  label: string;
  from: string;
  activities: number;
  independent: number;
  /** Null when there is no activity, rather than a misleading zero percent. */
  independentRate: number | null;
  minutes: number;
  sessions: number;
  daysActive: number;
  subjects: SubjectReport[];
  /** Skills whose evidence currently reads as strong or mastered. */
  strongSkills: string[];
  /** Skills with evidence that are not yet confident — the useful focus list. */
  growingSkills: string[];
  /** True when there is nothing to report, so the UI can say so plainly. */
  empty: boolean;
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

const PERIOD_DAYS: Record<ReportPeriod, number> = { today: 1, week: 7, month: 30 };

/** Start of the reporting window, in the family's own time zone. */
export function periodStart(period: ReportPeriod, timeZone: string, now = new Date()) {
  // Midnight local to the family, not to the server.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const at = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const midnight = Date.UTC(at("year"), at("month") - 1, at("day"));
  // Offset between the family's midnight and the same instant in UTC.
  const offset = now.getTime() - Date.parse(
    `${new Intl.DateTimeFormat("sv-SE", { timeZone, dateStyle: "short", timeStyle: "medium" })
      .format(now)
      .replace(" ", "T")}Z`,
  );
  return new Date(midnight + offset - (PERIOD_DAYS[period] - 1) * 86400000);
}

function isoDay(value: string) {
  return value.slice(0, 10);
}

export function buildReport(
  profile: Pick<ExplorerProfile, "history" | "skillMastery" | "controls">,
  period: ReportPeriod,
  now = new Date(),
): Report {
  const timeZone = profile.controls?.timeZone ?? "UTC";
  const from = periodStart(period, timeZone, now);
  const entries = profile.history.filter((entry) => {
    const at = Date.parse(entry.date);
    return Number.isFinite(at) && at >= from.getTime() && at <= now.getTime();
  });

  const activities = entries.reduce((total, entry) => total + (entry.total || 0), 0);
  const independent = entries.reduce((total, entry) => total + (entry.first || 0), 0);
  const minutes = Math.round(
    entries.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0) / 60,
  );

  const subjects: SubjectReport[] = allSubjects.map((subject) => {
    const forSubject = entries.filter((entry) => entry.subject === subject);
    const skills = new Set<string>();
    for (const entry of forSubject) for (const id of entry.skillIds ?? []) skills.add(id);
    const meta = subjectMeta(subject);
    return {
      subject,
      label: meta.label,
      world: meta.world,
      activities: forSubject.reduce((total, entry) => total + (entry.total || 0), 0),
      independent: forSubject.reduce((total, entry) => total + (entry.first || 0), 0),
      skillsPractised: skills.size,
      minutes: Math.round(
        forSubject.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0) / 60,
      ),
    };
  });

  // Skill states are current, not period-scoped: mastery is a property of the learner,
  // and a skill does not stop being strong because the week rolled over. Only skills
  // touched within the period are listed, so the report stays about this period.
  const touched = new Set<string>();
  for (const entry of entries) for (const id of entry.skillIds ?? []) touched.add(id);
  const named = (id: string) => skillById.get(id)?.name;
  const strongSkills: string[] = [];
  const growingSkills: string[] = [];
  for (const id of touched) {
    const state = progressionState(profile.skillMastery[id]);
    const name = named(id);
    if (!name) continue;
    if (state === "strong" || state === "mastered") strongSkills.push(name);
    else if (state !== "discovering") growingSkills.push(name);
  }

  return {
    period,
    label: PERIOD_LABELS[period],
    from: from.toISOString(),
    activities,
    independent,
    independentRate: activities > 0 ? Math.round((independent / activities) * 100) : null,
    minutes,
    sessions: new Set(entries.map((entry) => entry.sessionId ?? entry.date)).size,
    daysActive: new Set(entries.map((entry) => isoDay(entry.date))).size,
    subjects: subjects.sort((left, right) => right.activities - left.activities),
    strongSkills: strongSkills.sort(),
    growingSkills: growingSkills.sort(),
    empty: entries.length === 0,
  };
}

export function buildReports(
  profile: Pick<ExplorerProfile, "history" | "skillMastery" | "controls">,
  now = new Date(),
): Record<ReportPeriod, Report> {
  return {
    today: buildReport(profile, "today", now),
    week: buildReport(profile, "week", now),
    month: buildReport(profile, "month", now),
  };
}

/**
 * A plain-language suggestion for where attention would help most, drawn from the
 * subject with the least recent practice that still has some evidence. Returns null
 * rather than inventing advice when there is not enough to go on.
 */
export function focusSuggestion(report: Report): string | null {
  if (report.empty) return null;
  const practised = report.subjects.filter((subject) => subject.activities > 0);
  if (practised.length < 2) return null;
  const quietest = practised[practised.length - 1];
  const busiest = practised[0];
  if (quietest.activities * 3 > busiest.activities) return null;
  return `${busiest.world} has had most of the attention ${report.label.toLowerCase()}. ${quietest.world} might be a good place to visit next.`;
}
