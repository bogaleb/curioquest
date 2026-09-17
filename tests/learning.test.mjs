import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";
const { questions, publicQuestion, validateCurriculum } = loadTs("lib/curriculum");
const { skillGraph, skillById, prerequisiteDepth } = loadTs("lib/skill-graph");
const { newExplorer, normalizeExplorer } = loadTs("lib/explorers");
const { recordAttempt, emptyMastery, progressionState } = loadTs("lib/mastery");
const { recommendQuest } = loadTs("lib/recommendation");
const { evaluateResponse } = loadTs("lib/activity-evaluation");
const day = "2026-09-17T12:00:00Z";

test("every legacy activity ID remains available; all activities map to real skills", () => {
  validateCurriculum();
  for (const grade of ["prek","grade1"]) for (const subject of ["reading","math","logic"])
    for (let i=0;i<18;i++) assert.ok(questions.some(q=>q.id===`${grade}-${subject}-${i}`));
  for (const q of questions) assert.ok(skillById.has(q.skillId));
});
test("a dependency cycle is rejected", () => {
  const node=skillGraph[0]; const before=node.prerequisites;
  try { node.prerequisites=[node.id]; assert.throws(()=>prerequisiteDepth(node.id), /Cycle/); }
  finally { node.prerequisites=before; }
});
test("one success is low-confidence evidence with a next-day review", () => {
  const map={}; const q=questions[0];
  recordAttempt(map,q,"session-1",true,true,new Date(day));
  assert.equal(map[q.skillId].nextReviewAt,"2026-09-18T12:00:00.000Z");
  assert.ok(map[q.skillId].score<80);
  assert.notEqual(progressionState(map[q.skillId]),"mastered");
});
test("repeating the same item cannot establish mastery", () => {
  const map={}; const q=questions[0];
  for(let i=0;i<20;i++) recordAttempt(map,q,"session-"+i,true,true,new Date(day));
  assert.equal(map[q.skillId].questionIds.length,1);
  assert.notEqual(progressionState(map[q.skillId]),"mastered");
  assert.equal(map[q.skillId].retainedReviews,0);
});
test("delayed independent recall advances review, same-day repetitions do not", () => {
  const map={}; const q=questions[0];
  recordAttempt(map,q,"a",true,true,new Date(day));
  recordAttempt(map,q,"b",true,true,new Date("2026-09-18T13:00:00Z"));
  assert.equal(map[q.skillId].retainedReviews,1);
  assert.equal(map[q.skillId].nextReviewAt,"2026-09-21T13:00:00.000Z");
  recordAttempt(map,q,"c",true,true,new Date("2026-09-18T14:00:00Z"));
  assert.equal(map[q.skillId].nextReviewAt,"2026-09-21T13:00:00.000Z");
});
test("quests are deterministic, unique, balanced, and within duration budgets", () => {
  for(const grade of ["prek","grade1"]) for(const duration of [8,10,15,20]) {
    const p=newExplorer("test", "Explorer", grade,"fox",[],duration);
    const plan=recommendQuest(p,"daily",new Date(day));
    assert.deepEqual(plan,recommendQuest(p,"daily",new Date(day)));
    assert.equal(new Set(plan.questionIds).size,plan.questionIds.length);
    assert.ok(plan.estimatedMinutes<=duration);
    assert.equal(new Set(plan.questionIds.map(id=>questions.find(q=>q.id===id).subject)).size,3);
  }
});
test("known weak prerequisites can cross a grade boundary", () => {
  const p=newExplorer("test","Explorer","grade1","fox");
  p.skillMastery["LOGIC.PK.PATTERN.AB_01"]={...emptyMastery(),attemptCount:3,score:20};
  const plan=recommendQuest(p,"logic",new Date(day));
  assert.equal(plan.plan[0].skillId,"LOGIC.PK.PATTERN.AB_01");
  assert.equal(plan.plan[0].reason,"prerequisite-support");
});
test("sorting solutions stay private and scoring accepts only complete assignments", () => {
  const q=questions.find(q=>q.engine?.kind==="sorting");
  assert.equal(publicQuestion(q).engine.solution,undefined);
  assert.deepEqual(evaluateResponse(q,JSON.stringify(q.engine.solution)),{valid:true,correct:true});
  assert.equal(evaluateResponse(q,'{}').valid,false);
  assert.equal(evaluateResponse(q,'invalid').valid,false);
  const wrong=Object.fromEntries(q.engine.items.map(i=>[i.id,q.engine.bins[0].id]));
  assert.deepEqual(evaluateResponse(q,JSON.stringify(wrong)),{valid:true,correct:false});
});
test("word building cannot submit letters that are not in the tray", () => {
  const q=questions.find(q=>q.engine?.kind==="word-builder");
  assert.equal(evaluateResponse(q,"pot").correct,true);
  assert.equal(evaluateResponse(q,"zzz").valid,false);
});
test("legacy profiles receive empty evidence without inventing mastery", () => {
  const p=normalizeExplorer({id:"maya",name:"Maya",grade:"grade1",stars:30,completed:3});
  assert.equal(p.stars,30); assert.equal(p.completed,3);
  assert.deepEqual(p.skillMastery,{});
});
