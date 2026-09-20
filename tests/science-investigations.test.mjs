import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { questions, publicQuestion } = loadTs("lib/curriculum");
const { evaluateResponse } = loadTs("lib/activity-evaluation");
const { skillById } = loadTs("lib/skill-graph");
const { scienceInvestigationActivities } = loadTs("lib/content/science-investigations");

const science = questions.filter((q) => q.subject === "science");
const investigations = scienceInvestigationActivities.filter((q) => q.engine.kind === "investigation");

/* --------------------------------------------------------- the content is sound */

test("every science activity answers its own question", () => {
  for (const question of scienceInvestigationActivities) {
    const result = evaluateResponse(question, question.answer);
    assert.ok(result.valid, `${question.id} rejects its own answer`);
    assert.ok(result.correct, `${question.id} marks its own answer wrong`);
  }
});

test("every science activity points at a real science skill in its own band", () => {
  for (const question of scienceInvestigationActivities) {
    const skill = skillById.get(question.skillId);
    assert.ok(skill, `${question.id} references unknown skill ${question.skillId}`);
    assert.equal(skill.subject, "science", `${question.id} is filed under a non-science skill`);
    assert.ok(skill.gradeBands.includes(question.grade), `${question.id} is outside its skill's bands`);
  }
});

test("science is no longer only a quiz", () => {
  // Wave 07's completion criterion, as a number. It was 19 activities, all
  // reasoning-choice, zero engines.
  const modelled = science.filter((q) => q.engine).length;
  assert.ok(modelled > science.length / 2, `only ${modelled} of ${science.length} science activities interact`);
  assert.ok(investigations.length >= 8, "too few genuine predict-from-evidence activities");
});

test("no science hint names the outcome it is hinting at", () => {
  for (const question of investigations) {
    const outcome = question.engine.outcomes.find((o) => o.id === question.answer);
    const label = outcome.label.toLowerCase().replace(/^(it will|the magnet will) /, "");
    assert.ok(
      !question.hint.toLowerCase().includes(label),
      `${question.id} hint gives away "${label}": ${question.hint}`,
    );
  }
});

test("every explanation says why, not just what", () => {
  // An explanation that only restates the outcome teaches nothing. Each of these has to
  // carry a reason, which in practice means it is a real sentence about a mechanism.
  for (const question of scienceInvestigationActivities) {
    assert.ok(question.explanation.length > 60, `${question.id} explanation is too thin to explain anything`);
    assert.ok(question.hint.length > 25, `${question.id} hint is too thin to be a strategy`);
    assert.deepEqual(question.options, [], `${question.id} still carries multiple-choice options`);
  }
});

/* ------------------------------------------------------- the investigation engine */

test("an investigation gives at least two clues and at least two outcomes", () => {
  // One clue is a statement, not an observation step; one outcome is not a prediction.
  for (const question of investigations) {
    assert.ok(question.engine.clues.length >= 2, `${question.id} has too few clues to be an investigation`);
    assert.ok(question.engine.outcomes.length >= 2, `${question.id} has nothing to choose between`);
    const ids = question.engine.clues.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${question.id} has duplicate clue ids`);
    const outcomes = question.engine.outcomes.map((o) => o.id);
    assert.equal(new Set(outcomes).size, outcomes.length, `${question.id} has duplicate outcome ids`);
  }
});

test("every clue detail says something the label does not", () => {
  for (const question of investigations) {
    for (const clue of question.engine.clues) {
      assert.ok(clue.detail.length > clue.label.length + 10, `${question.id}/${clue.id} reveals nothing when opened`);
    }
  }
});

test("the answer is always one of the outcomes offered", () => {
  for (const question of investigations) {
    assert.ok(
      question.engine.outcomes.some((o) => o.id === question.answer),
      `${question.id} has an answer no child could choose`,
    );
  }
});

test("an investigation rejects a prediction that was never on offer", () => {
  const question = investigations[0];
  assert.ok(!evaluateResponse(question, "whatever").valid);
  assert.ok(!evaluateResponse(question, "").valid);
  assert.ok(!evaluateResponse(question, JSON.stringify(["float"])).valid);
});

test("the two magnet investigations disagree, on purpose", () => {
  // The pair exists to break "shiny metal sticks to magnets". If a content edit ever
  // made them agree, the second one would stop teaching anything.
  const magnets = investigations.filter((q) => q.skillId === "SCI.G1.PHYS.MAGNET_01");
  assert.equal(magnets.length, 2);
  assert.notEqual(magnets[0].answer, magnets[1].answer, "both magnet activities now have the same outcome");
});

/* -------------------------------------------------------------- sorting and order */

test("every sorting activity files each item in a bin that exists", () => {
  for (const question of scienceInvestigationActivities.filter((q) => q.engine.kind === "sorting")) {
    const bins = question.engine.bins.map((b) => b.id);
    for (const item of question.engine.items) {
      const bin = question.engine.solution[item.id];
      assert.ok(bin, `${question.id}/${item.id} has no home`);
      assert.ok(bins.includes(bin), `${question.id}/${item.id} is filed in a bin that does not exist`);
    }
    for (const bin of bins) {
      assert.ok(
        question.engine.items.some((i) => question.engine.solution[i.id] === bin),
        `${question.id} offers an empty bin "${bin}", which is a trap rather than a category`,
      );
    }
  }
});

test("life cycles are shown out of order but solved in order", () => {
  for (const question of scienceInvestigationActivities.filter((q) => q.engine.kind === "ordering")) {
    const shown = question.engine.items.map((i) => i.id);
    assert.notDeepEqual(shown, question.engine.solution, `${question.id} is already in the right order on screen`);
    assert.deepEqual([...shown].sort(), [...question.engine.solution].sort(), `${question.id} shows different cards than it scores`);
  }
});

/* ------------------------------------------------------------------ nothing leaks */

test("a science activity never ships its answer, explanation or sorting key", () => {
  for (const question of scienceInvestigationActivities) {
    const sent = publicQuestion(question, "grade1");
    assert.equal(sent.answer, undefined, `${question.id} leaks its answer`);
    assert.equal(sent.explanation, undefined, `${question.id} leaks its explanation`);
    if (sent.engine.kind === "sorting" || sent.engine.kind === "ordering") {
      assert.equal(sent.engine.solution, undefined, `${question.id} leaks its solution`);
    }
  }
});

test("an investigation's clues reach the child, because looking is the activity", () => {
  // The opposite of a leak check, and worth pinning: if clue detail were ever stripped
  // as if it were answer material, the engine would gate on empty boxes.
  const sent = publicQuestion(investigations[0], "prek");
  assert.equal(sent.engine.clues.length, investigations[0].engine.clues.length);
  for (const clue of sent.engine.clues) assert.ok(clue.detail.length > 0);
});
