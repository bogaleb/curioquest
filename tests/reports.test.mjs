import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { buildReport, buildReports, focusSuggestion, periodStart } = loadTs("lib/reports");
const { newExplorer } = loadTs("lib/explorers");
const { emptyMastery } = loadTs("lib/mastery");
const { allSubjects } = loadTs("lib/subjects");

const NOW = new Date("2026-09-20T15:00:00Z");
const base = () => {
  const profile = newExplorer("r", "Rae", "grade1", "fox");
  profile.controls.timeZone = "UTC";
  return profile;
};

const entry = (over) => ({
  date: NOW.toISOString(), subject: "reading", first: 3, total: 5,
  grade: "grade1", skillIds: [], durationSeconds: 300, sessionId: "s1", ...over,
});

test("an empty history reports nothing rather than a flattering zero", () => {
  const report = buildReport(base(), "week", NOW);
  assert.ok(report.empty);
  assert.equal(report.activities, 0);
  // A rate of 0% would read as "got everything wrong"; null reads as "no data".
  assert.equal(report.independentRate, null);
  assert.equal(report.daysActive, 0);
  assert.deepEqual(report.strongSkills, []);
});

test("counts come straight from recorded activity", () => {
  const profile = base();
  profile.history = [
    entry({ first: 4, total: 5, durationSeconds: 300 }),
    entry({ subject: "math", first: 1, total: 4, durationSeconds: 180, sessionId: "s2" }),
  ];
  const report = buildReport(profile, "today", NOW);
  assert.equal(report.activities, 9);
  assert.equal(report.independent, 5);
  assert.equal(report.independentRate, Math.round((5 / 9) * 100));
  assert.equal(report.minutes, 8);
  assert.equal(report.sessions, 2);
  assert.equal(report.daysActive, 1);
  assert.ok(!report.empty);
});

test("activity outside the window is excluded, and today is narrower than the month", () => {
  const profile = base();
  profile.history = [
    entry({ date: "2026-09-20T09:00:00Z" }),
    entry({ date: "2026-09-16T09:00:00Z", sessionId: "s2" }),
    entry({ date: "2026-06-01T09:00:00Z", sessionId: "s3" }),
  ];
  const reports = buildReports(profile, NOW);
  assert.equal(reports.today.activities, 5);
  assert.equal(reports.week.activities, 10);
  assert.equal(reports.month.activities, 10, "the June session is outside 30 days");
});

test("every subject appears, ordered by how much practice it received", () => {
  const profile = base();
  profile.history = [
    entry({ subject: "math", total: 9, first: 4 }),
    entry({ subject: "reading", total: 2, first: 2, sessionId: "s2" }),
  ];
  const report = buildReport(profile, "today", NOW);
  assert.equal(report.subjects.length, allSubjects.length);
  assert.equal(report.subjects[0].subject, "math");
  assert.equal(report.subjects[0].activities, 9);
  assert.equal(report.subjects[1].subject, "reading");
  // Untouched subjects are present at zero, so nothing silently disappears.
  assert.ok(report.subjects.every((s) => typeof s.activities === "number"));
});

test("skills are split into strong and growing using recorded evidence only", () => {
  const profile = base();
  profile.history = [entry({ skillIds: ["LIT.G1.PH.CVC_01", "LIT.G1.COMP.INFER_01"] })];
  profile.skillMastery = {
    "LIT.G1.PH.CVC_01": { ...emptyMastery(), attemptCount: 8, score: 88, confidence: 70 },
    "LIT.G1.COMP.INFER_01": { ...emptyMastery(), attemptCount: 3, score: 45 },
  };
  const report = buildReport(profile, "today", NOW);
  assert.deepEqual(report.strongSkills, ["Blend CVC words"]);
  assert.deepEqual(report.growingSkills, ["Make a simple inference"]);
});

test("a skill practised outside the window is not reported for this period", () => {
  const profile = base();
  profile.history = [entry({ date: "2026-01-02T09:00:00Z", skillIds: ["LIT.G1.PH.CVC_01"] })];
  profile.skillMastery = {
    "LIT.G1.PH.CVC_01": { ...emptyMastery(), attemptCount: 8, score: 95, confidence: 80 },
  };
  assert.deepEqual(buildReport(profile, "week", NOW).strongSkills, []);
});

test("focus advice is withheld unless the imbalance is real", () => {
  const profile = base();
  profile.history = [entry({ subject: "reading", total: 5 })];
  assert.equal(focusSuggestion(buildReport(profile, "today", NOW)), null, "one subject is not an imbalance");

  profile.history.push(entry({ subject: "math", total: 4, sessionId: "s2" }));
  assert.equal(focusSuggestion(buildReport(profile, "today", NOW)), null, "5 vs 4 is not an imbalance");

  profile.history = [entry({ subject: "reading", total: 20 }), entry({ subject: "math", total: 2, sessionId: "s2" })];
  const advice = focusSuggestion(buildReport(profile, "today", NOW));
  assert.ok(advice && advice.includes("Number City"), advice);
});

test("the window opens at the family's local midnight, not the server's", () => {
  const nz = periodStart("today", "Pacific/Auckland", NOW);
  const utc = periodStart("today", "UTC", NOW);
  assert.notEqual(nz.toISOString(), utc.toISOString());
});

test("building a report never mutates the profile", () => {
  const profile = base();
  profile.history = [entry({})];
  const before = JSON.stringify(profile);
  buildReports(profile, NOW);
  assert.equal(JSON.stringify(profile), before);
});
