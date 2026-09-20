import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { scaffoldForMisses, nextScaffold, assistedIntro } = loadTs("lib/scaffolding");
const { learningBands, resolveBand } = loadTs("lib/learning-bands");

const band = (id) => resolveBand(id);

test("the first wrong answer still brings the authored hint, as it always did", () => {
  for (const b of learningBands) {
    assert.equal(scaffoldForMisses(1, b), 1, b.id);
  }
});

test("nothing is owed before a wrong answer", () => {
  for (const b of learningBands) {
    assert.equal(scaffoldForMisses(0, b), 0, b.id);
    assert.equal(scaffoldForMisses(-1, b), 0, b.id);
  }
});

test("repeated misses escalate instead of repeating the same hint forever", () => {
  // This is the behaviour that did not exist: misses were counted and never read, so a
  // child could be wrong five times and read the identical sentence each time.
  const young = band("early-preschool");
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((n) => scaffoldForMisses(n, young)),
    [1, 2, 3, 3, 3],
  );
});

test("older children get more room to struggle before the reasoning is shown", () => {
  // Productive struggle is a stated principle. A child shown the worked explanation
  // after two wrong answers never gets to find it themselves.
  const young = band("early-preschool");
  const old = band("grade3");
  const workedAt = (b) => [1, 2, 3, 4, 5, 6].find((n) => scaffoldForMisses(n, b) === 3);
  assert.ok(workedAt(old) > workedAt(young), "grade 3 should wait longer than early preschool");

  // And the ordering holds across every band, never going backwards with maturity.
  const points = learningBands.map((b) => workedAt(b));
  for (let i = 1; i < points.length; i += 1) {
    assert.ok(points[i] >= points[i - 1], `${learningBands[i].id} regressed`);
  }
});

test("the ladder never skips straight to the worked explanation", () => {
  for (const b of learningBands) {
    let seen = 0;
    for (let misses = 1; misses <= 8; misses += 1) {
      const level = scaffoldForMisses(misses, b);
      assert.ok(level - seen <= 1, `${b.id} jumped from ${seen} to ${level}`);
      seen = Math.max(seen, level);
    }
    assert.equal(seen, 3, `${b.id} never reaches the worked explanation`);
  }
});

test("help already taken is never walked back, and is never re-counted", () => {
  const b = band("grade1");
  // A child who asked their way to level 3 does not get dropped to level 1 by a miss.
  assert.equal(nextScaffold(1, 3, b), null);
  assert.equal(nextScaffold(2, 3, b), null);
  // Nothing new owed means nothing is recorded again.
  assert.equal(nextScaffold(1, 1, b), null);
  // But genuine escalation is reported.
  assert.equal(nextScaffold(3, 1, b), 2);
  assert.equal(nextScaffold(4, 2, b), 3);
});

test("Nova never announces the answer when she steps in", () => {
  for (const level of [1, 2, 3]) {
    const intro = assistedIntro(level);
    assert.ok(intro.length > 8, `level ${level} has no wording`);
    assert.doesNotMatch(intro, /the answer is/i, `level ${level} gives it away`);
    // Nor should it read as a judgement on the child.
    assert.doesNotMatch(intro, /wrong|incorrect|failed/i, `level ${level} is corrective`);
  }
});

test("level one stays silent, so existing help totals do not jump for unchanged behaviour", () => {
  // The authored hint has always accompanied a wrong answer without being counted as
  // help. app/api/quest/route.ts therefore acts only on `owed >= 2`. This pins the
  // contract that makes that safe: the first miss never owes more than level one.
  for (const b of learningBands) {
    assert.equal(scaffoldForMisses(1, b), 1, `${b.id} escalates on the very first miss`);
  }
});

test("every band reaches volunteered help within a reasonable number of tries", () => {
  // A ladder that never triggers in practice is the same as no ladder. No child should
  // have to be wrong more than five times before Nova steps in.
  for (const b of learningBands) {
    const first = [1, 2, 3, 4, 5].find((n) => scaffoldForMisses(n, b) >= 2);
    assert.ok(first, `${b.id} never offers volunteered help within five misses`);
  }
});
