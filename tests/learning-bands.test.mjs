import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const {
  learningBands,
  bandById,
  bandForAge,
  ageFromDateOfBirth,
  contentBandsFor,
  primaryContentBand,
  resolveBand,
  isLearningBandId,
  neighbouringBand,
  atOrBeyond,
} = loadTs("lib/learning-bands");
const { newExplorer, normalizeExplorer } = loadTs("lib/explorers");
const { recommendQuest } = loadTs("lib/recommendation");
const { questions } = loadTs("lib/curriculum");

test("the band ladder covers ages 3 to 9 with no gaps and no overlaps", () => {
  assert.equal(learningBands.length, 6);
  for (let index = 1; index < learningBands.length; index += 1) {
    assert.equal(
      learningBands[index].ageMin,
      learningBands[index - 1].ageMax,
      `band ${learningBands[index].id} must begin where the previous one ends`,
    );
  }
  assert.equal(learningBands[0].ageMin, 3);
  assert.equal(learningBands.at(-1).ageMax, 9);
});

test("ages map to the expected band and clamp outside the supported range", () => {
  assert.equal(bandForAge(3).id, "early-preschool");
  assert.equal(bandForAge(5).id, "kindergarten");
  assert.equal(bandForAge(7).id, "grade2");
  assert.equal(bandForAge(9).id, "grade3");
  // Outside the ladder we clamp rather than fail, so a profile is never content-less.
  assert.equal(bandForAge(2).id, "early-preschool");
  assert.equal(bandForAge(14).id, "grade3");
  assert.equal(bandForAge(Number.NaN).id, "prek");
});

test("age is derived from a date of birth without counting an unreached birthday", () => {
  const now = new Date("2026-09-19T00:00:00Z");
  assert.equal(ageFromDateOfBirth("2020-09-18", now), 6);
  assert.equal(ageFromDateOfBirth("2020-09-20", now), 5);
  assert.equal(ageFromDateOfBirth(null, now), null);
  assert.equal(ageFromDateOfBirth("not-a-date", now), null);
});

test("delivery adapts across the ladder rather than only relabelling", () => {
  const youngest = bandById.get("early-preschool").delivery;
  const oldest = bandById.get("grade3").delivery;
  assert.equal(youngest.instruction, "audio-first");
  assert.equal(oldest.instruction, "independent");
  assert.ok(youngest.autoNarrate && !oldest.autoNarrate);
  assert.ok(youngest.maxChoices < oldest.maxChoices);
  assert.ok(youngest.maxPromptWords < oldest.maxPromptWords);
  assert.ok(youngest.touchTargetPx > oldest.touchTargetPx);
  assert.ok(youngest.hintAfterSeconds < oldest.hintAfterSeconds);
  assert.ok(!youngest.allowTyping && oldest.allowTyping);

  // Every adaptive dimension must move monotonically along the ladder.
  for (let index = 1; index < learningBands.length; index += 1) {
    const previous = learningBands[index - 1].delivery;
    const current = learningBands[index].delivery;
    assert.ok(current.touchTargetPx <= previous.touchTargetPx);
    assert.ok(current.maxPromptWords >= previous.maxPromptWords);
    assert.ok(current.hintAfterSeconds >= previous.hintAfterSeconds);
    assert.ok(current.sessionMinutes >= previous.sessionMinutes);
  }
});

test("every band resolves to a content pool that actually holds activities", () => {
  for (const band of learningBands) {
    const pools = contentBandsFor(band.id);
    assert.ok(pools.length > 0, `${band.id} has no pool`);
    for (const pool of pools) {
      assert.ok(
        questions.some((question) => question.grade === pool),
        `${band.id} points at empty pool ${pool}`,
      );
    }
    assert.equal(primaryContentBand(band.id), pools[0]);
  }
});

test("unknown and legacy band values resolve safely", () => {
  assert.equal(resolveBand(undefined).id, "prek");
  assert.equal(resolveBand("nonsense").id, "prek");
  // Both legacy grade tracks are themselves band IDs, which is what lets stored
  // profiles keep working with no migration.
  assert.ok(isLearningBandId("prek"));
  assert.ok(isLearningBandId("grade1"));
  assert.equal(resolveBand("grade1").id, "grade1");
});

test("band neighbours clamp at both ends of the ladder", () => {
  assert.equal(neighbouringBand("early-preschool", -1).id, "early-preschool");
  assert.equal(neighbouringBand("grade3", 1).id, "grade3");
  assert.equal(neighbouringBand("kindergarten", 1).id, "grade1");
  assert.ok(atOrBeyond("grade2", "kindergarten"));
  assert.ok(!atOrBeyond("prek", "grade1"));
});

test("a profile stored before bands existed keeps its content and gains a band", () => {
  const legacy = normalizeExplorer({ id: "a", name: "Ada", grade: "grade1" });
  assert.equal(legacy.band, "grade1");
  assert.equal(legacy.grade, "grade1");

  const legacyPrek = normalizeExplorer({ id: "b", name: "Bo", grade: "prek" });
  assert.equal(legacyPrek.band, "prek");
  assert.equal(legacyPrek.grade, "prek");
});

test("a new band drives the content pool its profile reads from", () => {
  const kindergarten = newExplorer("c", "Cy", "prek", "fox", [], 10, "kindergarten");
  const normalized = normalizeExplorer(kindergarten);
  assert.equal(normalized.band, "kindergarten");
  // Kindergarten draws on both pools, and its primary pool decides the stored track.
  assert.deepEqual(contentBandsFor("kindergarten"), ["prek", "grade1"]);
  assert.equal(normalized.grade, "prek");

  const grade3 = normalizeExplorer(newExplorer("d", "Di", "grade1", "owl", [], 20, "grade3"));
  assert.equal(grade3.band, "grade3");
  assert.equal(grade3.grade, "grade1");
});

test("recommendations respect the band's content pools and difficulty window", () => {
  const byId = new Map(questions.map((question) => [question.id, question]));

  const youngest = normalizeExplorer(newExplorer("e", "Eli", "prek", "fox", [], 10, "early-preschool"));
  const early = recommendQuest(youngest, "daily", new Date("2026-09-19T12:00:00Z"));
  assert.ok(early.questionIds.length > 0, "a three-year-old must still get a quest");
  for (const id of early.questionIds) {
    assert.equal(byId.get(id).grade, "prek", "early preschool must not be served Grade 1 content");
  }

  const oldest = normalizeExplorer(newExplorer("f", "Fay", "grade1", "owl", [], 20, "grade3"));
  const late = recommendQuest(oldest, "daily", new Date("2026-09-19T12:00:00Z"));
  assert.ok(late.questionIds.length > 0);
  for (const id of late.questionIds) {
    assert.equal(byId.get(id).grade, "grade1", "Grade 3 must not be served Pre-K content");
  }
});

test("every band can be served a quest in every subject", () => {
  const now = new Date("2026-09-19T12:00:00Z");
  for (const band of learningBands) {
    const profile = normalizeExplorer(
      newExplorer(`g-${band.id}`, "Explorer", primaryContentBand(band.id), "fox", [], 10, band.id),
    );
    for (const subject of ["reading", "math", "logic", "daily"]) {
      const quest = recommendQuest(profile, subject, now);
      assert.ok(
        quest.questionIds.length > 0,
        `${band.id} received an empty ${subject} quest`,
      );
    }
  }
});

test("choice count narrows by band and never removes the correct answer", () => {
  const { publicQuestion } = loadTs("lib/curriculum");
  const multipleChoice = questions.filter((question) => !question.engine && question.options.length >= 3);
  assert.ok(multipleChoice.length > 0, "expected authored multiple-choice activities");

  for (const question of multipleChoice.slice(0, 40)) {
    for (const band of learningBands) {
      const limit = band.delivery.maxChoices;
      const served = publicQuestion(question, band.id);
      assert.ok(
        served.options.length <= Math.max(limit, 1),
        `${question.id} served ${served.options.length} choices to ${band.id} (limit ${limit})`,
      );
      assert.ok(
        served.options.includes(question.answer),
        `${question.id} dropped the answer for ${band.id}`,
      );
      // Narrowing is presentation only; the answer key must never reach the child.
      assert.equal(served.answer, undefined);
      assert.equal(served.explanation, undefined);
      // Order is preserved so the layout does not reshuffle between renders.
      assert.deepEqual(served.options, question.options.filter((o) => served.options.includes(o)));
    }
  }
});

test("a three-year-old sees fewer choices than an eight-year-old on the same activity", () => {
  const { publicQuestion } = loadTs("lib/curriculum");
  const question = questions.find((q) => !q.engine && q.options.length >= 3);
  const youngest = publicQuestion(question, "early-preschool").options.length;
  const oldest = publicQuestion(question, "grade3").options.length;
  assert.ok(youngest < oldest, `expected fewer choices for the youngest band (${youngest} vs ${oldest})`);
  assert.equal(youngest, 2);
});

test("serving without a band leaves the authored activity untouched", () => {
  const { publicQuestion } = loadTs("lib/curriculum");
  const question = questions.find((q) => !q.engine && q.options.length >= 3);
  assert.deepEqual(publicQuestion(question).options, question.options);
});
