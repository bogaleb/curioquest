import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { loadTs } from "../tests/load-typescript.mjs";

const root=resolve(import.meta.dirname,"..");
const state=mkdtempSync(join(tmpdir(),"curioquest-integration-"));
const wrangler=join(root,"node_modules/wrangler/bin/wrangler.js");
const config=join(root,"dist/server/wrangler.json");
const {questions}=loadTs("lib/curriculum");
const env={...process.env,WRANGLER_SEND_METRICS:"false",CLOUDFLARE_CF_FETCH_ENABLED:"false",WRANGLER_LOG_PATH:join(state,"logs")};
const migration=spawnSync(process.execPath,[wrangler,"d1","execute","DB","--local","--config",config,"--persist-to",state,"--file",join(root,"drizzle/0000_left_talisman.sql")],{cwd:root,env,encoding:"utf8"});
assert.equal(migration.status,0,migration.stderr);
const child=spawn(process.execPath,[wrangler,"dev","--config",config,"--local","--persist-to",state,"--ip","127.0.0.1","--port","4187","--inspector-port","0"],{cwd:root,env,stdio:["pipe","pipe","pipe"]});
let logs="";child.stdout.on("data",chunk=>logs+=chunk);child.stderr.on("data",chunk=>logs+=chunk);
const base="http://127.0.0.1:4187";
async function call(body,expected=200) {
  const response=await fetch(base+"/api/quest",body?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:undefined);
  const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;
}
function answerFor(q) {
  if(q.engine?.kind==="sorting") return JSON.stringify(q.engine.solution);
  if(q.engine?.kind==="memory") return JSON.stringify(q.engine.sequence);
  return q.answer;
}
async function finish(profile,{mistake=false}={}) {
  let p=profile;
  let last;
  while(p.session.question) {
    const question=p.session.question;
    const q=questions.find(item=>item.id===question.id);
    assert.ok(q);assert.equal(question.answer,undefined);assert.equal(question.engine?.solution,undefined);
    if(mistake&&question.options.length>1) {
      const wrong=question.options.find(option=>option!==q.answer);
      const before=p.skillMastery[q.skillId]?.attemptCount??0;
      p=(await call({action:"answer",profile:p.id,session:p.session.id,question:q.id,answer:wrong})).profile;
      const observed=p.skillMastery[q.skillId].attemptCount;
      assert.equal(observed,before+1);
      p=(await call({action:"answer",profile:p.id,session:p.session.id,question:q.id,answer:wrong})).profile;
      assert.equal(p.skillMastery[q.skillId].attemptCount,observed,"Retry inflated evidence");
      mistake=false;
    }
    last={action:"answer",profile:p.id,session:p.session.id,question:q.id,answer:answerFor(q)};
    p=(await call(last)).profile;
  }
  await call(last,409);
  return p;
}
try {
  for(let tries=0;;tries++) {
    if(logs.includes("Ready on"))break;
    if(tries>100||child.exitCode!==null)throw new Error("Test server failed: "+logs);
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  let {profiles}=await call();
  assert.equal(profiles.length,2);
  const malformed=await fetch(base+"/api/quest",{method:"POST",headers:{"Content-Type":"application/json"},body:"{"});assert.equal(malformed.status,400);
  const unknown=await call({action:"start",profile:"missing",subject:"daily"},404);assert.ok(unknown.error);
  for(const original of profiles) {
    let p=original;
    for(let chapter=0;chapter<3;chapter++) {
      p=(await call({action:"campaign-start",profile:p.id})).profile;
      assert.equal(p.session.chapter,chapter);
      p=await finish(p,{mistake:chapter===0});
      assert.ok(p.adventure.chapters.includes(chapter));
      assert.equal(p.history[0].total,4);
    }
    assert.equal(p.stars,24);
    assert.equal(p.adventure.unlocks.length,3);
    await call({action:"campaign-start",profile:p.id},409);
    const garden=Array(24).fill("empty");garden[0]="flower";garden[1]="water";garden[2]="path";
    p=(await call({action:"save-garden",profile:p.id,garden})).profile;
    assert.deepEqual(p.adventure.garden,garden);
    await call({action:"save-garden",profile:p.id,garden:["forged"]},400);
    await call({action:"offline-confirm",profile:p.id},409);
    await call({action:"offline-request",profile:p.id});
    p=(await call({action:"offline-confirm",profile:p.id})).profile;
    assert.ok(p.adventure.offline.confirmedAt);
    const last=p.history[0];
    await call({action:"feeling",profile:p.id,session:last.sessionId,value:"right"});
    const loaded=(await call()).profiles.find(item=>item.id===p.id);
    assert.deepEqual(loaded.adventure.garden,garden);
    assert.equal(loaded.adventure.feelings.length,1);
  }
  profiles=(await call()).profiles;
  const started=await call({action:"team-start",profile:profiles[0].id,partner:profiles[1].id});
  assert.equal(started.profiles.length,2);
  await call({action:"team-complete",profile:profiles[0].id},409);
  await finish(started.profiles[0]);
  await call({action:"team-complete",profile:profiles[0].id},409);
  await finish(started.profiles[1]);
  const completed=await call({action:"team-complete",profile:profiles[0].id});
  for(const p of completed.profiles) assert.ok(p.adventure.unlocks.includes("Team treehouse"));
  const repeated=await call({action:"team-complete",profile:profiles[0].id});
  assert.deepEqual(repeated.profiles.map(p=>p.stars),completed.profiles.map(p=>p.stars));
  for(const p of repeated.profiles) assert.equal(p.adventure.unlocks.filter(x=>x==="Team treehouse").length,1);
  for (const grade of ["prek", "grade1"]) {
    let p=(await call({action:"create-profile",name:"Welcome explorer",grade,avatar:"owl",interests:[],dailyGoal:10},201)).profile;
    p=(await call({action:"discovery-start",profile:p.id})).profile;
    const first=p.session.question;
    const hinted=await call({action:"hint",profile:p.id,session:p.session.id,question:first.id});
    assert.ok(hinted.feedback.hint);
    const resumed=(await call({action:"discovery-start",profile:p.id})).profile;
    assert.equal(resumed.session.id,p.session.id);
    p=await finish(resumed);
    assert.equal(p.discovery.grade,grade);
    assert.equal(p.discovery.subjects.reading.startingLevel,1,"Hinted discovery must not raise starting level");
    assert.equal(p.discovery.subjects.math.startingLevel,2);
    assert.equal(p.history[0].discovery,true);
    assert.equal(p.stars,12);
    const last=p.reflections.length;
    const question=p.session.plan.at(-1).questionId;
    p=(await call({action:"reflect",profile:p.id,session:p.session.id,question,strategy:"clue"})).profile;
    assert.equal(p.reflections.length,last+1);
    await call({action:"discovery-start",profile:p.id},409);
    assert.ok((await call()).profiles.find(x=>x.id===p.id).discovery.completedAt);
  }
  console.log("PASS: both campaign tracks, retry evidence, replay protection, garden persistence, offline confirmation, feelings, and atomic Team Quest completion.");
  console.log("Isolated test state: "+state);
} finally {
  child.kill();
}
