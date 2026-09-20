import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { subjectRegistry, allSubjects, coreSubjects, subjectMeta, worldName } = loadTs("lib/subjects");
const { questions, validateCurriculum } = loadTs("lib/curriculum");
const { skillGraph, skillById } = loadTs("lib/skill-graph");
const { learningBands, primaryContentBand } = loadTs("lib/learning-bands");
const { newExplorer, normalizeExplorer } = loadTs("lib/explorers");
const { recommendQuest } = loadTs("lib/recommendation");

test("the registry is the single source of truth and is internally consistent", () => {
  validateCurriculum();
  assert.equal(new Set(allSubjects).size, allSubjects.length);
  assert.ok(coreSubjects.length === 3, "reading, math and logic anchor the day");
  for (const subject of subjectRegistry) {
    assert.ok(subject.world && subject.label && subject.eyebrow);
    assert.ok(subject.younger !== subject.older, `${subject.id} must differ by maturity`);
    assert.equal(worldName(subject.id), subject.world);
    assert.equal(subjectMeta(subject.id).id, subject.id);
  }
});

test("every subject has skills and authored activities in both content pools", () => {
  for (const subject of allSubjects) {
    const skills = skillGraph.filter((skill) => skill.subject === subject && skill.active);
    assert.ok(skills.length >= 3, `${subject} has too few active skills (${skills.length})`);
    for (const pool of ["prek", "grade1"]) {
      const authored = questions.filter((q) => q.subject === subject && q.grade === pool);
      assert.ok(authored.length >= 4, `${subject}/${pool} has only ${authored.length} activities`);
    }
  }
});

test("every activity points at an active skill of its own subject", () => {
  for (const question of questions) {
    const skill = skillById.get(question.skillId);
    assert.ok(skill, `${question.id} references unknown skill ${question.skillId}`);
    assert.equal(skill.subject, question.subject, `${question.id} subject mismatch`);
    assert.ok(skill.active, `${question.id} references an inactive skill`);
  }
});

test("a long session widens into the explore subjects instead of repeating the core", () => {
  const profile = normalizeExplorer(newExplorer("w", "Wren", "grade1", "fox", [], 20, "grade1"));
  const plan = recommendQuest(profile, "daily", new Date("2026-09-20T12:00:00Z"));
  const byId = new Map(questions.map((q) => [q.id, q]));
  const covered = new Set(plan.questionIds.map((id) => byId.get(id).subject));
  for (const core of coreSubjects) assert.ok(covered.has(core), `missing core subject ${core}`);
  assert.ok(covered.size > coreSubjects.length, "expected explore subjects in a 20-minute day");
});

test("each new subject can be requested on its own by every band", () => {
  const now = new Date("2026-09-20T12:00:00Z");
  for (const subject of allSubjects) {
    for (const band of learningBands) {
      const profile = normalizeExplorer(
        newExplorer(`s-${subject}-${band.id}`, "Explorer", primaryContentBand(band.id), "fox", [], 10, band.id),
      );
      const plan = recommendQuest(profile, subject, now);
      assert.ok(plan.questionIds.length > 0, `${band.id} got no ${subject} quest`);
    }
  }
});

test("explorer profiles carry a trail for every subject, including after an old profile loads", () => {
  const legacy = normalizeExplorer({ id: "old", name: "Old", grade: "prek", skills: { reading: { seen: 4, first: 2, level: 2 } } });
  for (const subject of allSubjects) {
    assert.ok(legacy.skills[subject], `missing trail for ${subject}`);
    assert.equal(typeof legacy.skills[subject].level, "number");
  }
  // Existing evidence survives the widening.
  assert.equal(legacy.skills.reading.seen, 4);
  assert.equal(legacy.skills.reading.level, 2);
});
