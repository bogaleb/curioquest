import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { validateCatalogue, catalogueErrors, describeProblem } = loadTs("lib/catalogue/model");
const { toQuestion, questionsFromSnapshot, readSnapshot } = loadTs("lib/catalogue/catalogue");

/**
 * WP-05's acceptance criteria, as tests.
 *
 * "Adding a lesson requires no deploy" is exercised by the studio against a live
 * database and cannot be asserted here. What can be — and what the blueprint asks for
 * by name — is that a deliberately broken item fails publish validation with a readable
 * error, that a published snapshot round-trips into the `Question` shape the engines
 * consume, and that the `reviewStatus` gate actually gates.
 */

function skill(over = {}) {
  return {
    id: "MATH.COUNT.1", subject: "math", strand: "counting", name: "Counting to five",
    childName: "Count with me", description: "Counting small groups of objects.",
    prerequisites: [], bands: ["prek", "kindergarten"], evidenceTarget: 5, active: true,
    ...over,
  };
}

function lesson(over = {}) {
  return {
    id: "count-to-five", skillId: "MATH.COUNT.1", title: "Counting to five",
    childTitle: "Count with me", model: null, position: 1, reviewStatus: "published",
    ...over,
  };
}

function item(over = {}) {
  return {
    id: "count-to-five-1", lessonId: "count-to-five", skillId: "MATH.COUNT.1",
    verb: "say", phase: "guided", bands: ["prek"],
    prompt: { en: "How many apples?" },
    hint: { en: "Touch each apple as you count." },
    explanation: { en: "Three apples." },
    answer: "3",
    distractors: [
      { value: "2", errorKind: "off-by-one", reviewed: true, note: null },
      { value: "4", errorKind: "off-by-one", reviewed: true, note: null },
    ],
    assets: [],
    delivery: {
      activityType: "count", subject: "math", grade: "prek", level: 1,
      estimatedMinutes: 1, contextTags: [], visual: "🍎🍎🍎",
      options: ["2", "3", "4"],
    },
    reviewStatus: "published",
    ...over,
  };
}

function catalogue(over = {}) {
  return {
    version: 1, label: "test", skills: [skill()], lessons: [lesson()], items: [item()],
    assets: [], episodes: [], ...over,
  };
}

test("a sound catalogue validates with no errors", () => {
  const problems = validateCatalogue(catalogue());
  assert.deepEqual(catalogueErrors(problems), [], describeProblem(problems[0] ?? { where: "", field: "", message: "none" }));
});

test("a deliberately broken item fails publish validation with a readable error", () => {
  // The blueprint's own example: an item published inside a lesson that is not.
  const problems = validateCatalogue(catalogue({
    lessons: [lesson({ reviewStatus: "draft" })],
  }));
  const errors = catalogueErrors(problems);
  assert.ok(errors.length > 0, "a published item in a draft lesson has to block a publish");

  const sentence = describeProblem(errors[0]);
  // Readable means: it names the row to open, the field to change, and finishes the
  // sentence "this item ...". `items.0.reviewStatus: Invalid input` is none of those.
  assert.match(sentence, /^item count-to-five-1 — reviewStatus: /);
  assert.match(sentence, /is published inside a lesson that is not/);
  assert.ok(!/invalid input/i.test(sentence), "a Zod code is not an error an author can act on");
});

test("every broken shape becomes a sentence rather than a path", () => {
  const cases = [
    [{ items: [item({ answer: "", distractors: [] })] }, /has no right answer/],
    [{ items: [item({ skillId: "MATH.MISSING" })] }, /which is not in the catalogue/],
    [{ items: [item({ answer: "2" })] }, /answer/],
    [{ skills: [skill({ prerequisites: ["MATH.COUNT.1"] })] }, /requires itself/],
    [{ skills: [skill({ prerequisites: ["MATH.NOWHERE"] })] }, /not in the catalogue/],
    [{ lessons: [lesson({ skillId: "MATH.NOWHERE" })], items: [] }, /not in the catalogue/],
  ];
  for (const [over, expected] of cases) {
    const errors = catalogueErrors(validateCatalogue(catalogue(over)));
    assert.ok(errors.length, `${JSON.stringify(over).slice(0, 60)} should have been refused`);
    const sentences = errors.map(describeProblem).join("\n");
    assert.match(sentences, expected);
    for (const problem of errors) {
      assert.ok(problem.where && problem.field && problem.message, "every problem names a row, a field and a reason");
    }
  }
});

test("a malformed catalogue is refused rather than parsed into nonsense", () => {
  assert.ok(catalogueErrors(validateCatalogue({ nope: true })).length);
  assert.ok(catalogueErrors(validateCatalogue(null)).length);
  assert.equal(readSnapshot({ nope: true }), null);
  // A snapshot that cannot be trusted reads as null, which puts the loader back on the
  // bundled bank rather than taking every family's session down with it.
  assert.equal(readSnapshot("not a catalogue"), null);
});

test("a snapshot round-trips into the Question shape with the authored option order", () => {
  const snapshot = readSnapshot(catalogue());
  assert.ok(snapshot, "a sound catalogue has to survive its own schema");

  const [question] = questionsFromSnapshot(snapshot);
  assert.equal(question.id, "count-to-five-1");
  assert.equal(question.answer, "3");
  assert.equal(question.prompt, "How many apples?");
  assert.equal(question.hint, "Touch each apple as you count.");
  assert.equal(question.skillId, "MATH.COUNT.1");
  assert.equal(question.lessonId, "count-to-five");
  assert.equal(question.verb, "say");
  assert.equal(question.subject, "math");
  assert.equal(question.grade, "prek");
  // Order is a delivery decision. Falling back to answer-then-distractors would
  // reshuffle every live item on the day the catalogue went in.
  assert.deepEqual(question.options, ["2", "3", "4"]);
});

test("an option the authored order forgot is still offered", () => {
  // Editing the distractors without rewriting `delivery.options` must not silently drop
  // a choice the item depends on.
  const question = toQuestion(item({ delivery: { ...item().delivery, options: ["2", "3"] } }));
  assert.deepEqual(question.options, ["2", "3", "4"]);
});

test("only reasons a person wrote travel with the question", () => {
  const question = toQuestion(item({
    distractors: [
      { value: "2", errorKind: "off-by-one", reviewed: true, note: null },
      { value: "4", errorKind: null, reviewed: false, note: null },
    ],
  }));
  // A distractor with no authored reason is left out entirely rather than passed along
  // as null: `lib/distractor-reasons.ts` treats an authored reason as final, so a null
  // would suppress the runtime inference and leave the child with no teaching move.
  assert.deepEqual(question.distractorReasons, [{ value: "2", errorKind: "off-by-one" }]);
});

test("the published gate holds even for a snapshot loaded from a fixture", () => {
  const snapshot = readSnapshot(catalogue({
    items: [
      item(),
      item({ id: "count-to-five-2", reviewStatus: "reviewed" }),
      item({ id: "count-to-five-3", reviewStatus: "draft" }),
    ],
  }));
  const served = questionsFromSnapshot(snapshot).map((question) => question.id);
  assert.deepEqual(served, ["count-to-five-1"]);
});

test("the §C5 word budget is measured against the youngest band an item is offered to", () => {
  const wordy = { en: "How many red apples are sitting in the big wooden basket today" };
  const younger = validateCatalogue(catalogue({ items: [item({ bands: ["early-preschool"], prompt: wordy })] }));
  const older = validateCatalogue(catalogue({ items: [item({ bands: ["grade1"], prompt: wordy })] }));
  const mentions = (problems) => problems.filter((problem) => /word/i.test(problem.message)).length;
  assert.ok(mentions(younger) > 0, "thirteen words is too many for an early-preschool screen");
  assert.ok(mentions(younger) > mentions(older), "the same prompt must not be judged the same at both ends of the ladder");
});
