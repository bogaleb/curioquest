import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { loadTs } from "./load-typescript.mjs";

const { discoveryLessons } = loadTs("lib/discover/content");
const { discoverySources } = loadTs("lib/discover/sources");
const { publicDiscoveries, judgeDiscovery, discoveryQuestion, discoveryItemId } = loadTs("lib/discover/engine");
const { learningBands } = loadTs("lib/learning-bands");
const { tierForBand } = loadTs("lib/science/tier");
const { skillById } = loadTs("lib/skill-graph");
const { newExplorer } = loadTs("lib/explorers");

test("all discoveries have three distinct teaching versions, real skills, sources, and reachable destinations", () => {
  assert.equal(new Set(discoveryLessons.map((l) => l.id)).size, 12);
  assert.equal(new Set(discoveryLessons.map((l) => l.domain)).size, 6);
  for (const lesson of discoveryLessons) {
    assert.equal(new Set(Object.values(lesson.versions).map((v) => v.idea)).size, 3, lesson.id);
    assert.ok(lesson.sourceIds.every((id) => discoverySources.some((s) => s.id === id)), lesson.id);
    assert.ok(readFileSync(`app/(explorer)${lesson.next.href}/page.tsx`, "utf8"));
    for (const version of Object.values(lesson.versions)) {
      assert.ok(skillById.has(version.skillId), version.skillId);
      for (const field of ["idea", "example", "notice", "talk", "away"]) assert.ok(version[field].length > 15, `${lesson.id}:${field}`);
    }
  }
});

test("public lessons omit all answer keys and post-answer explanations in every band", () => {
  for (const band of learningBands) {
    const lessons = publicDiscoveries(band.id);
    assert.equal(lessons.length, 12);
    for (const lesson of lessons) {
      assert.equal(lesson.versions, undefined);
      assert.equal(lesson.task.answer, undefined);
      assert.equal(lesson.task.explanation, undefined);
      assert.equal(lesson.practicedAt, null);
    }
  }
});

test("every authored answer succeeds; every valid alternative is rejected", () => {
  for (const band of learningBands) for (const lesson of discoveryLessons) {
    const task = lesson.versions[tierForBand(band.id)].task;
    assert.equal(judgeDiscovery(lesson.id, band.id, task.answer).correct, true);
    let wrong;
    if (task.kind === "sequence") wrong = [...task.answer].reverse();
    else if (task.kind === "build") wrong = [(task.answer[0] + 1) % (task.max + 1)];
    else wrong = [(task.answer[0] + 1) % task.choices.length];
    assert.equal(judgeDiscovery(lesson.id, band.id, wrong).correct, false);
    const question = discoveryQuestion(lesson.id, band.id);
    assert.equal(question.phase, "guided");
    assert.ok(["build", "sequence", "choose"].includes(question.verb));
  }
});

test("malformed answers, duplicate ordering steps and out-of-range quantities are rejected", () => {
  for (const response of [null, {}, "3", [-1], [1.2], [NaN], [Infinity], ["3"], [3, 3]]) assert.equal(judgeDiscovery("picnic-count", "prek", response), null);
  assert.equal(judgeDiscovery("picnic-count", "prek", [7]), null);
  assert.equal(judgeDiscovery("robot-plan", "prek", [0, 0]), null);
  assert.equal(judgeDiscovery("robot-plan", "prek", [0]), null);
  assert.equal(judgeDiscovery("robot-plan", "prek", [0, 2]), null);
  assert.equal(judgeDiscovery("word-detective", "prek", [2]), null);
  assert.equal(judgeDiscovery("not-authored", "prek", [0]), null);
});

test("practice in one tier is not presented as completed practice in another", () => {
  const history = new Map([[discoveryItemId("picnic-count", "prek"), "2026-09-24T10:00:00.000Z"]]);
  assert.ok(publicDiscoveries("prek", history).find((l) => l.id === "picnic-count").practicedAt);
  assert.equal(publicDiscoveries("grade2", history).find((l) => l.id === "picnic-count").practicedAt, null);
});

function harness() {
  let profile = newExplorer("c3c75e0d-86b3-4d4c-bce6-2740dc7c891b", "Test", "prek", "fox", ["animals"], 10, "prek");
  const state = { authorized: true, conflict: false, history: [], saves: 0, revision: 1, paused: false };
  const mocks = {
    "@/lib/backend/context": { withFamily: (handler) => handler },
    "@/lib/parent-security": { familyAuthorized: async () => state.authorized },
    "@/lib/backend/repository": {
      async readExplorer(id) { return id === profile.id ? { data: JSON.stringify({ ...profile, preferences: { ...profile.preferences, paused: state.paused } }), revision: state.revision } : null; },
      async readLearningEvents() { return state.history; },
      async saveExplorers(profiles, _reset, _attempt, events) {
        if (state.conflict) return false;
        profile = profiles[0].profile; state.revision++; state.saves++;
        for (const e of events) state.history.unshift({ id: e.id, item_id: e.itemId, session_id: e.sessionId, occurred_at: e.occurredAt, correct: e.correct, support: e.support, skill_id: e.skillId });
        return true;
      },
    },
  };
  const source = ts.transpileModule(readFileSync("app/api/discover/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loadedRoute = { exports: {} };
  new Function("require", "module", "exports", source)((name) => mocks[name] ?? loadTs(name.replace("@/", "")), loadedRoute, loadedRoute.exports);
  const input = { profile: profile.id, lesson: "picnic-count", response: [3], session: crypto.randomUUID(), attempt: crypto.randomUUID(), startedAt: Date.now() };
  const request = (body = input, origin = "http://localhost") => new Request("http://localhost/api/discover", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ...loadedRoute.exports, state, input, request, profile: () => profile };
}

test("API saves guided evidence and profile atomically, replays safely, and exposes progress on reload", async () => {
  const h = harness();
  const result = await h.POST(h.request());
  assert.equal(result.status, 200);
  assert.equal((await result.json()).correct, true);
  assert.equal(h.state.history[0].support, "model");
  assert.equal(h.profile().skillMastery["MATH.PK.NUM.CARDINAL_01"].independentCorrect, 0);
  const stars = h.profile().stars;
  await h.POST(h.request());
  assert.equal(h.state.saves, 1);
  assert.equal(h.profile().stars, stars);
  const loaded = await h.GET(new Request(`http://localhost/api/discover?profile=${h.input.profile}`));
  const data = await loaded.json();
  assert.ok(data.lessons.find((l) => l.id === "picnic-count").practicedAt);
  assert.equal(data.lessons[0].task.answer, undefined);
});

test("API refuses cross-origin, unauthorized, paused, foreign-profile and malformed submissions", async () => {
  const h = harness();
  assert.equal((await h.POST(h.request(h.input, "https://other.test"))).status, 403);
  h.state.authorized = false;
  assert.equal((await h.POST(h.request())).status, 403);
  h.state.authorized = true; h.state.paused = true;
  assert.equal((await h.POST(h.request())).status, 403);
  h.state.paused = false;
  assert.equal((await h.POST(h.request({ ...h.input, profile: crypto.randomUUID() }))).status, 404);
  assert.equal((await h.POST(h.request({ ...h.input, attempt: "fake" }))).status, 400);
  assert.equal((await h.POST(h.request({ ...h.input, response: [999] }))).status, 400);
  assert.equal(h.state.saves, 0);
});

test("a failed commit leaves no saved practice; retry succeeds; used attempt IDs cannot change verdict", async () => {
  const h = harness(); h.state.conflict = true;
  assert.equal((await h.POST(h.request())).status, 409);
  assert.equal(h.state.history.length, 0);
  h.state.conflict = false;
  assert.equal((await h.POST(h.request())).status, 200);
  assert.equal((await h.POST(h.request({ ...h.input, response: [2] }))).status, 409);
  assert.equal(h.state.saves, 1);
});
