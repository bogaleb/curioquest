import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { achievements, evaluateAchievements, nearlyThere, achievementSummary, categoryOrder } =
  loadTs("lib/achievements");
const { newExplorer } = loadTs("lib/explorers");
const { emptyMastery } = loadTs("lib/mastery");
const { allSubjects } = loadTs("lib/subjects");

const fresh = () => newExplorer("t", "Tester", "prek", "fox");

test("definitions are well formed and uniquely identified", () => {
  assert.equal(new Set(achievements.map((a) => a.id)).size, achievements.length);
  for (const achievement of achievements) {
    assert.ok(achievement.target > 0, `${achievement.id} needs a positive target`);
    assert.ok(achievement.name && achievement.earnedText && achievement.questText);
    assert.ok(categoryOrder.includes(achievement.category), `${achievement.id} has an unknown category`);
    assert.ok(["seed", "sprout", "bloom"].includes(achievement.tier));
    // Locked text describes a path to walk, never a shortfall.
    assert.ok(!/fail|behind|not enough|only/i.test(achievement.questText), achievement.id);
  }
});

test("a brand-new explorer has earned nothing and is shown no false progress", () => {
  const states = evaluateAchievements(fresh());
  assert.equal(states.filter((state) => state.earned).length, 0);
  for (const state of states) {
    assert.equal(state.progress, 0);
    assert.equal(state.fraction, 0);
  }
  // Nothing to nudge toward yet, so the home screen stays quiet.
  assert.deepEqual(nearlyThere(fresh()), []);
});

test("nothing is earned by attendance — only by recorded learning", () => {
  // A profile that has opened the app many times but never finished or practised
  // anything must still have nothing.
  const idle = { ...fresh(), stars: 500 };
  const earned = evaluateAchievements(idle).filter((state) => state.earned);
  assert.deepEqual(earned, [], "stars alone must not unlock an award");
});

test("finishing quests earns the journey ladder in order", () => {
  const profile = { ...fresh(), completed: 5 };
  const byId = new Map(evaluateAchievements(profile).map((s) => [s.achievement.id, s]));
  assert.ok(byId.get("first-discovery").earned);
  assert.ok(byId.get("trail-finder").earned);
  assert.ok(!byId.get("long-walker").earned);
  assert.equal(byId.get("long-walker").progress, 5);
  assert.equal(byId.get("long-walker").fraction, 0.25);
});

test("persistence is measured by recovering, not by being right first time", () => {
  const flawless = { ...fresh(), skillMastery: {
    "LIT.PK.PA.RHYME_01": { ...emptyMastery(), attemptCount: 6, correctCount: 6, independentCorrect: 6 },
  } };
  const persistent = { ...fresh(), skillMastery: {
    "LIT.PK.PA.RHYME_01": { ...emptyMastery(), attemptCount: 6, correctCount: 6, independentCorrect: 2 },
  } };
  const got = (p, id) => evaluateAchievements(p).find((s) => s.achievement.id === id);
  assert.ok(!got(flawless, "tried-again").earned, "a flawless run is not a comeback");
  assert.ok(got(persistent, "tried-again").earned, "working through difficulty counts");
});

test("exploring every world is earned only when every subject has evidence", () => {
  const skillFor = { reading: "LIT.PK.ORAL.WORD_01", math: "MATH.PK.NUM.CARDINAL_01",
    logic: "LOGIC.PK.PATTERN.AB_01", science: "SCI.PK.LIFE.NEEDS_01",
    world: "WORLD.PK.COMM.HELPERS_01", wellbeing: "WELL.PK.EMOTION.NAME_01" };
  const mastery = {};
  const check = () => evaluateAchievements({ ...fresh(), skillMastery: { ...mastery } })
    .find((s) => s.achievement.id === "every-world");

  for (const subject of allSubjects.slice(0, -1)) {
    mastery[skillFor[subject]] = { ...emptyMastery(), attemptCount: 1 };
  }
  assert.ok(!check().earned, "one missing world must keep it locked");

  mastery[skillFor[allSubjects.at(-1)]] = { ...emptyMastery(), attemptCount: 1 };
  assert.ok(check().earned);
});

test("nearlyThere surfaces only real, started progress, closest first", () => {
  const profile = { ...fresh(), completed: 4, reflections: [{}, {}, {}, {}] };
  const next = nearlyThere(profile, 3);
  assert.ok(next.length > 0);
  for (const state of next) {
    assert.ok(!state.earned);
    assert.ok(state.progress > 0, "never nudge toward something untouched");
  }
  for (let i = 1; i < next.length; i += 1) {
    assert.ok(next[i - 1].fraction >= next[i].fraction, "closest first");
  }
});

test("the parent summary counts every category and names practised subjects", () => {
  const summary = achievementSummary({ ...fresh(), completed: 1, skillMastery: {
    "SCI.PK.LIFE.NEEDS_01": { ...emptyMastery(), attemptCount: 3 },
  } });
  assert.equal(summary.total, achievements.length);
  assert.equal(summary.byCategory.length, categoryOrder.length);
  assert.equal(summary.subjectsPractised, 1);
  assert.deepEqual(summary.subjectNames, ["Science"]);
});

test("evaluation never mutates the profile it reads", () => {
  const profile = { ...fresh(), completed: 9 };
  const before = JSON.stringify(profile);
  evaluateAchievements(profile);
  achievementSummary(profile);
  nearlyThere(profile);
  assert.equal(JSON.stringify(profile), before);
});
