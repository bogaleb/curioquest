import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { teachingResponse, readingTeachingLine, unmetPrerequisite } = loadTs("lib/teaching-response");
const { errorKindFor } = loadTs("lib/distractor-reasons");
const { errorKinds, teachingMove } = loadTs("lib/error-kinds");
const { learningBands } = loadTs("lib/learning-bands");
const { wordBudget, countWords, systemWordsIn } = loadTs("lib/kid-copy");
const { emptyMastery } = loadTs("lib/mastery");
const { masteryState, evidenceGaps, meetsEvidenceRule } = loadTs("lib/evidence-rule");
const { progressionState } = loadTs("lib/mastery");

/**
 * Wrong answers that teach (WP-04).
 *
 * The acceptance criterion is a sentence: *two children giving different wrong answers on
 * the same item receive different next steps*. The first test is that sentence, executed.
 */

/** A letter-sound item of the shape the bank is full of. */
const letterItem = {
  skillId: "letter-sounds-m",
  answer: "m",
  options: ["m", "n", "w", "em"],
  activityType: "sound-choice",
  hint: "Listen for the first sound.",
  engine: undefined,
};

test("two children, one item, two wrong answers, two different next steps", () => {
  // Mira hears /m/ and picks n — the sounds are close. Theo sees the shape and picks w,
  // which is the same shape upside down.
  const mira = String("n");
  const theo = String("w");

  const miraKind = errorKindFor({ question: letterItem, response: mira });
  const theoKind = errorKindFor({ question: { ...letterItem, activityType: "visual-choice" }, response: theo });
  assert.equal(miraKind, "confusable-sound");
  assert.equal(theoKind, "confusable-visual");

  const miraNext = teachingResponse({ question: letterItem, response: mira, errorKind: miraKind, band: "prek" });
  const theoNext = teachingResponse({ question: letterItem, response: theo, errorKind: theoKind, band: "prek" });

  // Different move, different words, different thing on screen.
  assert.equal(miraNext.move, "relisten");
  assert.equal(theoNext.move, "compare");
  assert.notEqual(miraNext.message, theoNext.message);
  assert.equal(miraNext.listen, "m", "the sound is replayed, not described");
  assert.deepEqual(theoNext.compare, { chosen: "w", answer: "m" }, "the two shapes are put side by side");
  assert.equal(theoNext.listen, undefined);
  assert.equal(miraNext.compare, undefined);
});

test("a third child who said the letter's name gets a third answer", () => {
  const kind = errorKindFor({ question: letterItem, response: "em" });
  assert.equal(kind, "letter-name-for-sound");
  const next = teachingResponse({ question: letterItem, response: "em", errorKind: kind, band: "prek" });
  assert.equal(next.move, "sound-not-name");
  assert.equal(next.listen, "m");
  assert.match(next.message, /name/);
});

test("a counting slip is answered by counting, not by re-teaching", () => {
  const item = { skillId: "counting-to-10", answer: "7", options: ["6", "7", "8"], activityType: "visual-choice", hint: "Count again." };
  const kind = errorKindFor({ question: item, response: "6" });
  assert.equal(kind, "off-by-one");
  const next = teachingResponse({ question: item, response: "6", errorKind: kind, band: "kindergarten" });
  assert.equal(next.move, "recount");
  assert.equal(next.count, 7, "the counters to touch are the answer, not the child's guess");
});

test("every move has somewhere to go and something to say", () => {
  for (const kind of errorKinds) {
    const next = teachingResponse({
      question: letterItem,
      response: "n",
      errorKind: kind,
      band: "prek",
      mastery: {},
    });
    assert.equal(next.move, teachingMove(kind), kind);
    assert.ok(next.message.length > 0, `${kind} says nothing`);
  }
});

test("an unclassified wrong answer still gets a warm line, never a verdict", () => {
  const next = teachingResponse({ question: letterItem, response: "zzz", errorKind: null, band: "prek" });
  assert.equal(next.move, null);
  assert.ok(next.message.length > 0);
  assert.doesNotMatch(next.message, /(wrong|bad|fail|oops)/i);
});

// ---------------------------------------------------------------------------
// Copy rules (§C5) — these lines are said to a four-year-old who got it wrong
// ---------------------------------------------------------------------------

test("every line fits the band it is said to, and says nothing about the system", () => {
  for (const band of learningBands) {
    const budget = wordBudget(band.id);
    for (const kind of [...errorKinds, null]) {
      const next = teachingResponse({
        question: letterItem, response: "n", errorKind: kind, band: band.id, mastery: {},
      });
      const onScreen = countWords(next.message) + countWords(next.hint ?? "");
      assert.ok(onScreen <= budget,
        `${band.id}/${kind}: ${onScreen} words on screen, over the ${budget}-word budget`);
      assert.deepEqual(systemWordsIn(`${next.message} ${next.hint ?? ""}`), [], `${band.id}/${kind}`);
      // Never tells the child they are wrong as a verdict, and never shouts.
      assert.doesNotMatch(next.message, /[A-Z]{3,}/);
    }
  }
});

test("the youngest band is told less than the oldest", () => {
  const young = teachingResponse({ question: letterItem, response: "w", errorKind: "confusable-visual", band: "early-preschool" });
  const old = teachingResponse({ question: letterItem, response: "w", errorKind: "confusable-visual", band: "grade2" });
  assert.ok(countWords(young.message) <= countWords(old.message));
});

// ---------------------------------------------------------------------------
// The prerequisite detour
// ---------------------------------------------------------------------------

test("a gap in the foundation routes backwards, and names where to", () => {
  const { skillGraph } = loadTs("lib/skill-graph");
  const withPrerequisite = skillGraph.find((skill) => skill.prerequisites.length > 0);
  assert.ok(withPrerequisite, "the graph has no prerequisites to test");

  const untouched = teachingResponse({
    question: { ...letterItem, skillId: withPrerequisite.id },
    response: "n",
    errorKind: "not-yet-taught",
    band: "prek",
    mastery: {},
  });
  assert.equal(untouched.move, "step-back");
  assert.equal(untouched.stepBackSkillId, withPrerequisite.prerequisites[0]);

  // A child who has started the prerequisite is not sent backwards again.
  const started = teachingResponse({
    question: { ...letterItem, skillId: withPrerequisite.id },
    response: "n",
    errorKind: "not-yet-taught",
    band: "prek",
    mastery: Object.fromEntries(
      withPrerequisite.prerequisites.map((id) => [id, { ...emptyMastery(), attemptCount: 1 }]),
    ),
  });
  assert.equal(started.stepBackSkillId, undefined);
  assert.equal(unmetPrerequisite(withPrerequisite.id, {}), withPrerequisite.prerequisites[0]);
});

// ---------------------------------------------------------------------------
// The evidence rule (§C2), asked of both data sources
// ---------------------------------------------------------------------------

test("mastery needs all three legs, whichever data is asked", () => {
  const all = { representations: 2, spaced: true, consecutiveIndependent: 2 };
  assert.equal(masteryState(all, true), "mastered");
  assert.equal(masteryState(all, false), "untouched");
  for (const missing of [
    { ...all, representations: 1 },
    { ...all, spaced: false },
    { ...all, consecutiveIndependent: 1 },
  ]) {
    assert.equal(masteryState(missing, true), "practising");
    assert.ok(!meetsEvidenceRule(missing));
    assert.ok(evidenceGaps(missing).length >= 1, "a gap that is not explained to a parent");
  }
  assert.deepEqual(evidenceGaps(all), []);
});

test("a high score cannot buy mastery on its own", () => {
  // The old rule called this mastered: a perfect score from five independent answers in
  // one sitting, in one activity type, never revisited.
  const oneSitting = {
    ...emptyMastery(),
    score: 100, confidence: 90, attemptCount: 5, correctCount: 5,
    independentCorrect: 5, consecutiveIndependent: 5,
    activityTypes: ["visual-choice"], sessionIds: ["s1", "s2", "s3"],
    questionIds: ["q1", "q2", "q3", "q4"], retainedReviews: 0,
  };
  assert.equal(progressionState(oneSitting), "strong");

  const earned = {
    ...oneSitting,
    activityTypes: ["visual-choice", "word-builder"],
    retainedReviews: 1,
    consecutiveIndependent: 2,
  };
  assert.equal(progressionState(earned), "mastered");
});

// ---------------------------------------------------------------------------
// The reading slice answers the same way
// ---------------------------------------------------------------------------

test("the reading slice branches on the same taxonomy", () => {
  const heard = readingTeachingLine("confusable-sound", "prek");
  const seen = readingTeachingLine("confusable-visual", "prek");
  const unknown = readingTeachingLine(null, "prek");
  assert.notEqual(heard, seen);
  assert.notEqual(heard, unknown);
  for (const line of [heard, seen, unknown]) {
    assert.ok(countWords(line) <= wordBudget("prek"), line);
  }
});
