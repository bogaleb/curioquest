import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const {
  itemVerdict, needsRewrite, describeRetention, emptyRetention,
  DOMINANT_DISTRACTOR_SHARE, MIN_WRONG_ANSWERS,
} = loadTs("lib/insights");
const { projectMastery, masteryFromEvents, evidenceState } = loadTs("lib/mastery-projection");
const { withProjectedMastery, unexplainedSkills } = loadTs("lib/backend/repository");

/**
 * WP-06's two queries and the one judgement the switch to the projection makes.
 *
 * The aggregation itself is SQL and is not exercised here. What is exercised is every
 * threshold the product acts on, because a threshold with no test is a number somebody
 * will change without noticing what it decides.
 */

function health(over = {}) {
  return {
    itemId: "count-to-five-1", skillId: "MATH.COUNT.1", prompt: "How many apples?",
    reviewStatus: "published", attempts: 40, correct: 25, wrong: 15,
    topDistractor: "4", topPicks: 5, share: 5 / 15, errorKind: null, reviewed: false,
    ...over,
  };
}

test("an item whose wrong answers are spread across the choices is healthy", () => {
  const verdict = itemVerdict(health());
  assert.equal(verdict.kind, "healthy");
  assert.match(verdict.sentence, /spread across the choices/);
});

test("one distractor over 60% of wrong answers is flagged for rewrite", () => {
  const verdict = itemVerdict(health({ topPicks: 11, share: 11 / 15 }));
  assert.equal(verdict.kind, "rewrite");
  assert.match(verdict.sentence, /73% of wrong answers are “4”/);
});

test("the flag sits exactly where WP-06 puts it, and not a point below", () => {
  const justUnder = itemVerdict(health({ topPicks: 9, share: DOMINANT_DISTRACTOR_SHARE }));
  const justOver = itemVerdict(health({ topPicks: 10, share: DOMINANT_DISTRACTOR_SHARE + 0.01 }));
  assert.notEqual(justUnder.kind, "rewrite", "at the threshold is not over it");
  assert.equal(justOver.kind, "rewrite");
});

test("a dominant distractor reads differently depending on whether anybody explained it", () => {
  const unexplained = itemVerdict(health({ topPicks: 12, share: 0.8 }));
  const explained = itemVerdict(health({ topPicks: 12, share: 0.8, errorKind: "off-by-one", reviewed: true }));
  assert.equal(unexplained.kind, "rewrite");
  assert.equal(explained.kind, "rewrite");
  // Same flag, different job: one is an authoring gap, the other a teaching gap.
  assert.match(unexplained.sentence, /no one has said why/);
  assert.match(explained.sentence, /already recorded why: off-by-one/);
  assert.match(explained.sentence, /lesson is not addressing/);
});

test("an item almost nobody gets right is not blamed on its distractors", () => {
  // Wrong answers spread evenly, but only 10% correct. Telling an author to rewrite a
  // distractor would send them to the wrong half of the item.
  const verdict = itemVerdict(health({ attempts: 40, correct: 4, wrong: 36, topPicks: 13, share: 13 / 36 }));
  assert.equal(verdict.kind, "rewrite");
  assert.match(verdict.sentence, /prompt or the lesson before it/);
});

test("too few wrong answers is never a verdict", () => {
  // Two children both picking `b` for `d` is a coincidence, not a signal.
  const verdict = itemVerdict(health({ attempts: 6, correct: 4, wrong: 2, topPicks: 2, share: 1 }));
  assert.equal(verdict.kind, "healthy");
  assert.match(verdict.sentence, /too few to judge/);
  assert.ok(MIN_WRONG_ANSWERS > 2);
});

test("needsRewrite returns the worst first and leaves the healthy alone", () => {
  const flagged = needsRewrite([
    health({ itemId: "a", topPicks: 10, share: 0.67 }),
    health({ itemId: "b", topPicks: 5, share: 0.33 }),
    health({ itemId: "c", topPicks: 14, share: 0.93 }),
  ]);
  assert.deepEqual(flagged.map((item) => item.itemId), ["c", "a"]);
});

test("retention is described with its denominator, never as a bare percentage", () => {
  const sentence = describeRetention({
    ...emptyRetention(14), skillsLearned: 9, skillsRevisited: 4, skillsRetained: 3, rate: 0.75, awaiting: 5,
  }, "Maya");
  assert.match(sentence, /4 skills/);
  assert.match(sentence, /3 were still there/);
  assert.match(sentence, /1 needed another look/);
  assert.ok(!/%/.test(sentence), "a percentage with no denominator reads as a grade (§D5)");
});

test("a skill nobody has met again is reported as waiting, not as forgotten", () => {
  const waiting = describeRetention({ ...emptyRetention(14), skillsLearned: 6, awaiting: 6 }, "Maya");
  assert.match(waiting, /waiting to be met again/);
  assert.match(waiting, /Nothing has come round yet/);

  const nothing = describeRetention(emptyRetention(14), "Maya");
  assert.match(nothing, /has not practised anything yet/);
});

test("everything held gets its own sentence rather than 100%", () => {
  const sentence = describeRetention({
    ...emptyRetention(30), skillsLearned: 3, skillsRevisited: 3, skillsRetained: 3, rate: 1,
  }, "Sam");
  assert.match(sentence, /was still there|were still there/);
  assert.match(sentence, /30 days/);
  assert.ok(!/%/.test(sentence));
});

// ---------------------------------------------------------------------------
// The switch itself
// ---------------------------------------------------------------------------

function profile(skillMastery) {
  return { id: "11111111-1111-4111-8111-111111111111", name: "Maya", skillMastery };
}

test("the projection wins for every skill the event stream reaches", () => {
  const blob = { "READ.SOUND.M": { score: 10, attemptCount: 1 } };
  const projected = { "11111111-1111-4111-8111-111111111111": { "READ.SOUND.M": { score: 88, attemptCount: 9 } } };
  const merged = withProjectedMastery(profile(blob), projected);
  assert.equal(merged.skillMastery["READ.SOUND.M"].score, 88);
  assert.equal(merged.skillMastery["READ.SOUND.M"].attemptCount, 9);
});

test("mastery the event stream cannot explain is kept, not erased", () => {
  // `learning_events` began at WP-01. A family who played before that has history no
  // event can reproduce, and the product silently forgetting it would be a worse fault
  // than the blob being unauditable.
  const blob = { "READ.SOUND.M": { score: 70, attemptCount: 6 }, "MATH.COUNT.1": { score: 40, attemptCount: 3 } };
  const projected = { "11111111-1111-4111-8111-111111111111": { "READ.SOUND.M": { score: 88, attemptCount: 9 } } };
  const merged = withProjectedMastery(profile(blob), projected);
  assert.equal(merged.skillMastery["MATH.COUNT.1"].score, 40, "pre-stream history survives");
  assert.equal(merged.skillMastery["READ.SOUND.M"].score, 88);
  assert.deepEqual(unexplainedSkills(profile(blob), projected["11111111-1111-4111-8111-111111111111"]), ["MATH.COUNT.1"]);
});

test("a profile the projection knows nothing about is returned untouched", () => {
  const blob = { "MATH.COUNT.1": { score: 40, attemptCount: 3 } };
  const same = withProjectedMastery(profile(blob), {});
  assert.equal(same.skillMastery, blob, "no events for this child must not rewrite their record");
});

test("the projection and the map the app consumes agree on every skill", () => {
  const skillId = [...loadTs("lib/skill-graph").skillById.keys()][0];
  const events = [
    { sessionId: "s1", occurredAt: "2026-09-01T09:00:00Z", skillId, itemId: "i1", verb: "say", correct: true, support: "none" },
    { sessionId: "s2", occurredAt: "2026-09-03T09:00:00Z", skillId, itemId: "i2", verb: "build", correct: true, support: "none" },
  ];
  const full = projectMastery(events);
  const flat = masteryFromEvents(events);
  assert.equal(evidenceState(full[skillId]), "mastered", "two verbs, two days apart, both unaided");
  // `masteryFromEvents` is the same fold with the evidence detail dropped; the numbers
  // the recommender reads must not differ between the two.
  assert.equal(flat[skillId].score, full[skillId].score);
  assert.equal(flat[skillId].attemptCount, full[skillId].attemptCount);
  assert.equal(flat[skillId].consecutiveIndependent, full[skillId].consecutiveIndependent);
  assert.ok(!("evidence" in flat[skillId]));
});
