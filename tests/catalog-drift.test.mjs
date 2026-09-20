import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { questions } = loadTs("lib/curriculum");
const { recommendQuest } = loadTs("lib/recommendation");
const { startDiscovery } = loadTs("lib/discovery");
const { newExplorer, normalizeExplorer } = loadTs("lib/explorers");

/**
 * The published catalogue is versioned separately from the code, so a deploy can ship
 * new activities before the catalogue refresh is applied. When that happens the
 * selection logic must stay inside what the server can actually serve, rather than
 * handing back an id that resolves to nothing.
 */
const STALE = questions.filter((q) => !q.id.startsWith("play-") && !q.id.startsWith("prek-science")
  && !q.id.startsWith("grade1-science") && !q.id.startsWith("prek-world")
  && !q.id.startsWith("grade1-world") && !q.id.startsWith("prek-wellbeing")
  && !q.id.startsWith("grade1-wellbeing"));

test("the stale catalogue used by this test really is missing the new content", () => {
  assert.ok(STALE.length > 0);
  assert.ok(STALE.length < questions.length, "expected the new activities to be excluded");
});

test("recommendations never return an id outside the served catalogue", () => {
  const served = new Set(STALE.map((q) => q.id));
  const now = new Date("2026-09-20T12:00:00Z");
  for (const band of ["early-preschool", "prek", "kindergarten", "grade1", "grade2", "grade3"]) {
    const grade = band === "grade1" || band === "grade2" || band === "grade3" ? "grade1" : "prek";
    const profile = normalizeExplorer(newExplorer("d", "Drift", grade, "fox", [], 20, band));
    for (const subject of ["daily", "reading", "math", "logic", "science", "world", "wellbeing"]) {
      const plan = recommendQuest(profile, subject, now, STALE);
      for (const id of plan.questionIds) {
        assert.ok(served.has(id), `${band}/${subject} recommended unserved id ${id}`);
      }
    }
  }
});

test("a quest is still produced from a stale catalogue rather than coming back empty", () => {
  const profile = normalizeExplorer(newExplorer("e", "Eve", "prek", "fox", [], 10, "prek"));
  const plan = recommendQuest(profile, "daily", new Date("2026-09-20T12:00:00Z"), STALE);
  assert.ok(plan.questionIds.length > 0, "a stale catalogue must still yield a playable quest");
});

test("the welcome check also stays inside the served catalogue", () => {
  const served = new Set(STALE.map((q) => q.id));
  const profile = normalizeExplorer(newExplorer("f", "Fin", "prek", "fox", [], 10, "prek"));
  startDiscovery(profile, "session-1", STALE);
  assert.ok(profile.session.questions.length > 0);
  for (const id of profile.session.questions) {
    assert.ok(served.has(id), `welcome check used unserved id ${id}`);
  }
});

test("selection defaults to the full code catalogue when no pool is given", () => {
  const profile = normalizeExplorer(newExplorer("g", "Gus", "prek", "fox", [], 10, "prek"));
  const plan = recommendQuest(profile, "daily", new Date("2026-09-20T12:00:00Z"));
  const all = new Set(questions.map((q) => q.id));
  assert.ok(plan.questionIds.length > 0);
  for (const id of plan.questionIds) assert.ok(all.has(id));
});
