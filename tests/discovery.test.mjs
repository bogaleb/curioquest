import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";
const { newExplorer } = loadTs("lib/explorers");
const { questions } = loadTs("lib/curriculum");
const { startDiscovery, advanceDiscovery } = loadTs("lib/discovery");
const { authoredHint } = loadTs("lib/nova");

for (const grade of ["prek", "grade1"]) {
  test(`${grade}: welcome adapts each subject independently and preserves established trails`, () => {
    const p = newExplorer("test", "Explorer", grade, "fox");
    p.skills.logic = { seen: 20, first: 18, level: 3 };
    startDiscovery(p, "welcome");
    assert.equal(p.session.questions.length, 6);
    const id = p.session.id;
    startDiscovery(p, "do-not-replace");
    assert.equal(p.session.id, id);
    while (p.session.index < 6) {
      const q = questions.find(q => q.id === p.session.questions[p.session.index]);
      const independent = q.subject !== "reading";
      p.skills[q.subject].seen++;
      p.session.index++;
      advanceDiscovery(p, q, independent);
      if (p.session.index % 2 === 1) {
        const next = questions.find(q => q.id === p.session.questions[p.session.index]);
        assert.equal(next.level, independent ? 2 : 1);
        assert.equal(next.subject, q.subject);
        assert.equal(p.session.plan[p.session.index].skillId, next.skillId);
      }
    }
    assert.equal(new Set(p.session.questions).size, 6);
    assert.equal(p.discovery.subjects.reading.startingLevel, 1);
    assert.equal(p.discovery.subjects.math.startingLevel, 2);
    assert.equal(p.skills.math.level, 2);
    assert.equal(p.skills.logic.level, 3);
    assert.throws(() => startDiscovery(p, "replay"), /already knows/);
    assert.deepEqual(p.skillMastery, {}, "Placement cannot invent mastery");
  });
}

test("Nova only supplies hints for the approved activity context", () => {
  const q = questions[0];
  const context = { activityId: q.id, skillId: q.skillId, track: q.grade, hintLevel: 1 };
  assert.equal(authoredHint(q, context).text, q.hint);
  assert.equal(authoredHint(q, { ...context, hintLevel: 3 }).text, q.explanation);
  assert.throws(() => authoredHint(q, { ...context, skillId: "unapproved" }), /approved activity/);
});
