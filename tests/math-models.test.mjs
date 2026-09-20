import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { questions } = loadTs("lib/curriculum");
const { evaluateResponse } = loadTs("lib/activity-evaluation");
const { publicQuestion } = loadTs("lib/curriculum");
const { skillById } = loadTs("lib/skill-graph");
const { mathModelActivities } = loadTs("lib/content/math-models");

const MODEL_KINDS = ["number-line", "number-bond", "place-value", "array-builder"];
const models = questions.filter((q) => MODEL_KINDS.includes(q.engine?.kind));
const ask = (question, response) => evaluateResponse(question, response);

/* ------------------------------------------------------- the content is sound */

test("every authored math model answers its own question", () => {
  // The single most valuable check here: an activity whose authored answer the engine
  // itself would mark wrong is an activity that punishes a child for being right.
  for (const question of mathModelActivities) {
    const result = ask(question, question.answer);
    assert.ok(result.valid, `${question.id} rejects its own answer as invalid`);
    assert.ok(result.correct, `${question.id} marks its own answer wrong`);
  }
});

test("every math model points at a skill that exists", () => {
  for (const question of mathModelActivities) {
    const skill = skillById.get(question.skillId);
    assert.ok(skill, `${question.id} references unknown skill ${question.skillId}`);
    assert.equal(skill.subject, "math", `${question.id} is filed under a non-math skill`);
    assert.ok(skill.gradeBands.includes(question.grade), `${question.id} is in a band its skill does not cover`);
  }
});

test("no math model hint gives away the answer", () => {
  // Wave 06 is explicit: hints reveal the strategy, not the number.
  for (const question of mathModelActivities) {
    if (question.engine.kind === "place-value" || question.engine.kind === "array-builder") continue;
    assert.ok(
      !new RegExp(`\\b${question.answer}\\b`).test(question.hint),
      `${question.id} hint contains the answer: ${question.hint}`,
    );
  }
});

test("every math model asks something, and explains something", () => {
  for (const question of mathModelActivities) {
    assert.ok(question.prompt.length > 15, `${question.id} has a thin prompt`);
    assert.ok(question.hint.length > 15, `${question.id} has a thin hint`);
    assert.ok(question.explanation.length > 15, `${question.id} has a thin explanation`);
    assert.deepEqual(question.options, [], `${question.id} still carries multiple-choice options`);
  }
});

test("the models cover both bands and all four engines", () => {
  for (const kind of MODEL_KINDS) {
    assert.ok(mathModelActivities.some((q) => q.engine.kind === kind), `nothing uses ${kind}`);
  }
  for (const grade of ["prek", "grade1"]) {
    assert.ok(mathModelActivities.some((q) => q.grade === grade), `nothing authored for ${grade}`);
  }
});

test("math is no longer mostly a question with buttons under it", () => {
  // The wave forbids plain text + four buttons as the *default*. A deliberate minority
  // of abstract fluency items is correct; a majority is the thing being fixed.
  const math = questions.filter((q) => q.subject === "math");
  const modelled = math.filter((q) => q.engine).length;
  assert.ok(modelled / math.length > 0.7, `only ${modelled} of ${math.length} math activities use a model`);
});

/* ------------------------------------------------------------- the number line */

const line = { engine: { kind: "number-line", min: 0, max: 20, start: 6 }, answer: "9", options: [] };

test("the number line accepts any landing inside it and nothing outside", () => {
  assert.ok(ask(line, "9").correct);
  assert.ok(ask(line, "11").valid, "overshooting has to be a legal move, or the line is a button");
  assert.ok(!ask(line, "11").correct);
  assert.ok(!ask(line, "21").valid);
  assert.ok(!ask(line, "-1").valid);
  assert.ok(!ask(line, "seven").valid);
  assert.ok(!ask(line, "9.5").valid);
});

/* -------------------------------------------------------------- the number bond */

test("a bond is judged by its own arithmetic, not by an authored string", () => {
  // The engine is self-validating, like the balance scale: whatever the child fills in
  // is right exactly when the parts make the whole. An authored answer cannot drift.
  const missingWhole = { engine: { kind: "number-bond", whole: null, parts: [4, 3], emoji: "🍎" }, answer: "7", options: [] };
  assert.ok(ask(missingWhole, "7").correct);
  assert.ok(!ask(missingWhole, "8").correct);

  const missingLeft = { engine: { kind: "number-bond", whole: 10, parts: [null, 6], emoji: "🍎" }, answer: "4", options: [] };
  assert.ok(ask(missingLeft, "4").correct);
  assert.ok(!ask(missingLeft, "16").correct);

  const missingRight = { engine: { kind: "number-bond", whole: 10, parts: [6, null], emoji: "🍎" }, answer: "4", options: [] };
  assert.ok(ask(missingRight, "4").correct);
});

test("a bond with a wrong authored answer would still be scored correctly", () => {
  // Proving the property above, not testing arithmetic: the authored answer is a lie
  // here and the engine ignores it.
  const lying = { engine: { kind: "number-bond", whole: null, parts: [2, 3], emoji: "⭐" }, answer: "99", options: [] };
  assert.ok(ask(lying, "5").correct, "the model should trust itself over the authored string");
  assert.ok(!ask(lying, "99").correct);
});

test("a bond rejects things that are not a number", () => {
  const bond = { engine: { kind: "number-bond", whole: null, parts: [4, 3], emoji: "🍎" }, answer: "7", options: [] };
  for (const bad of ["", "-3", "seven", "3,4", "1e3"]) assert.ok(!ask(bond, bad).valid, `accepted ${bad}`);
});

/* --------------------------------------------------------------- place value */

const mat = { engine: { kind: "place-value", target: 14, maxTens: 4 }, answer: "1,4", options: [] };

test("place value insists the tens are made, not counted out in ones", () => {
  assert.ok(ask(mat, "1,4").correct, "one ten and four ones is fourteen");
  // This is the lesson, not a technicality: fourteen loose cubes is fourteen, and the
  // mat still says no, which is the moment regrouping stops being an arbitrary rule.
  const fourteenOnes = ask(mat, "0,14");
  assert.ok(fourteenOnes.valid, "it should be a real attempt, not a malformed one");
  assert.ok(!fourteenOnes.correct, "ten or more loose ones should not be accepted");
  assert.ok(!ask(mat, "2,4").correct);
  assert.ok(!ask(mat, "1,3").correct);
});

test("place value rejects a mat that could not exist", () => {
  assert.ok(!ask(mat, "9,0").valid, "more tens than the mat holds");
  assert.ok(!ask(mat, "1").valid);
  assert.ok(!ask(mat, "1,2,3").valid);
  assert.ok(!ask(mat, "a,b").valid);
});

test("a round ten is built with no ones at all", () => {
  const thirty = { engine: { kind: "place-value", target: 30, maxTens: 4 }, answer: "3,0", options: [] };
  assert.ok(ask(thirty, "3,0").correct);
  assert.ok(!ask(thirty, "2,10").correct, "two tens and ten ones is thirty, but not on a place-value mat");
});

/* -------------------------------------------------------------- array builder */

const array = { engine: { kind: "array-builder", rows: 3, columns: 4, emoji: "🍎", maxRows: 6, maxColumns: 7 }, answer: "3,4", options: [] };

test("an array has to be the shape that was asked for", () => {
  assert.ok(ask(array, "3,4").correct);
  // 2 by 6 is also twelve. It is not three rows of four, and the difference is the
  // structure the activity is about.
  assert.ok(!ask(array, "2,6").correct);
  assert.ok(!ask(array, "4,3").correct);
  assert.ok(!ask(array, "9,9").valid);
  assert.ok(!ask(array, "3").valid);
});

/* ------------------------------------------------------ nothing leaks to the child */

test("a model activity never ships its answer or explanation to the browser", () => {
  for (const question of models) {
    const sent = publicQuestion(question, "grade1");
    assert.equal(sent.answer, undefined, `${question.id} leaks its answer`);
    assert.equal(sent.explanation, undefined, `${question.id} leaks its explanation`);
  }
});

test("what a model does send is already visible in the prompt", () => {
  // place-value and array-builder carry their target in the engine, because the child
  // is asked to *build* a stated number or shape rather than to guess a hidden one.
  // That is only safe while the prompt states it, so this checks that it does.
  for (const question of models) {
    if (question.engine.kind === "place-value") {
      assert.ok(
        question.prompt.includes(String(question.engine.target)),
        `${question.id} hides its target in the engine instead of asking for it`,
      );
    }
    if (question.engine.kind === "array-builder") {
      assert.ok(
        question.prompt.includes(String(question.engine.rows)) && question.prompt.includes(String(question.engine.columns)),
        `${question.id} hides its shape in the engine instead of asking for it`,
      );
    }
  }
});
