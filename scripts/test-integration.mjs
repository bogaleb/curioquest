import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { loadTs } from "../tests/load-typescript.mjs";
import { solveRoute } from "../tests/solve-route.mjs";

const root=resolve(import.meta.dirname,"..");
const state=mkdtempSync(join(tmpdir(),"curioquest-integration-"));
const wrangler=join(root,"node_modules/wrangler/bin/wrangler.js");
const config=join(root,"dist/server/wrangler.json");
const {questions}=loadTs("lib/curriculum");
const {arcadeGames}=loadTs("lib/arcade");
const env={...process.env,WRANGLER_SEND_METRICS:"false",CLOUDFLARE_CF_FETCH_ENABLED:"false",WRANGLER_LOG_PATH:join(state,"logs")};
for(const file of readdirSync(join(root,"drizzle")).filter(f=>f.endsWith(".sql")).sort()) {
  const migration=spawnSync(process.execPath,[wrangler,"d1","execute","DB","--local","--config",config,"--persist-to",state,"--file",join(root,"drizzle",file)],{cwd:root,env,encoding:"utf8"});
  assert.equal(migration.status,0,migration.stderr);
}
const child=spawn(process.execPath,[wrangler,"dev","--config",config,"--local","--persist-to",state,"--ip","127.0.0.1","--port","4187","--inspector-port","0"],{cwd:root,env,stdio:["pipe","pipe","pipe"]});
let logs="";child.stdout.on("data",chunk=>logs+=chunk);child.stderr.on("data",chunk=>logs+=chunk);
const base="http://127.0.0.1:4187";
let parentCookie="";
async function parentCall(body,expected=200){
  const response=await fetch(base+"/api/parent",{method:"POST",headers:{"Content-Type":"application/json",Cookie:parentCookie},body:JSON.stringify(body)});
  const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));
  if(response.headers.get("set-cookie"))parentCookie=response.headers.get("set-cookie").split(";")[0];
  return data;
}
async function call(body,expected=200) {
  const response=await fetch(base+"/api/quest",body?{method:"POST",headers:{"Content-Type":"application/json",Cookie:parentCookie},body:JSON.stringify(body)}:undefined);
  const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;
}
async function workspace(body,expected=200,cookie=parentCookie){const response=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;}
function answerFor(q) {
  if(q.engine?.kind==="sorting") return JSON.stringify(q.engine.solution);
  if(q.engine?.kind==="matching"||q.engine?.kind==="ordering") return JSON.stringify(q.engine.solution);
  if(q.engine?.kind==="route") return JSON.stringify(solveRoute(q.engine));
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
  assert.equal((await fetch(base+"/api/parent/export")).status,403);
  await call({action:"create-profile",name:"Blocked",grade:"prek",avatar:"owl",interests:[],dailyGoal:10},403);
  const setup=await parentCall({action:"setup",pin:"482619"});
  assert.equal(setup.recoveryCode.length,64);
  const strangerHeaders={"oai-authenticated-user-id":"other-family",Cookie:parentCookie};
  assert.equal((await fetch(base+"/api/quest",{headers:strangerHeaders})).status,403);
  assert.equal((await fetch(base+"/api/parent",{headers:strangerHeaders})).status,403);
  assert.equal((await fetch(base+"/api/parent/export",{headers:strangerHeaders})).status,403);
  const exported=await fetch(base+"/api/parent/export",{headers:{Cookie:parentCookie}});
  assert.equal(exported.status,200);assert.equal((await exported.json()).profiles.length,2);
  await parentCall({action:"setup",pin:"123456"},409);
  await parentCall({action:"lock"});
  await call({action:"preferences",profile:profiles[0].id,autoRead:true,reducedMotion:true},403);
  for(let i=0;i<5;i++)await parentCall({action:"unlock",pin:"000000"},403);
  await parentCall({action:"unlock",pin:"482619"},429);
  // Advance the isolated rate-limit window, never the user's database.
  const resetWindow=spawnSync(process.execPath,[wrangler,"d1","execute","DB","--local","--config",config,"--persist-to",state,"--command","UPDATE parent_lock SET window_until = 0 WHERE id = 1"],{cwd:root,env,encoding:"utf8"});
  assert.equal(resetWindow.status,0,resetWindow.stderr);
  const recovered=await parentCall({action:"recover",pin:"618294",recoveryCode:setup.recoveryCode});
  assert.notEqual(recovered.recoveryCode,setup.recoveryCode);
  await parentCall({action:"lock"});
  await parentCall({action:"unlock",pin:"482619"},403);
  await parentCall({action:"unlock",pin:"618294"});
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
  const teamSessionId=started.profiles[0].session.id;
  const teamDetour=(await call({action:"game-start",profile:profiles[0].id,game:"stories",level:0})).profile;
  assert.equal(teamDetour.session.gameId,"stories");
  assert.ok(teamDetour.savedSessions.some(s=>s.id===teamSessionId));
  const teamResumed=(await call({action:"session-resume",profile:profiles[0].id,session:teamSessionId})).profile;
  assert.equal(teamResumed.session.teamId,started.profiles[0].session.teamId);
  await call({action:"team-complete",profile:profiles[0].id},409);
  await finish(teamResumed);
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
  for(const original of (await call()).profiles.slice(0,2)) {
    let p=original;
    await call({action:"game-start",profile:p.id,game:"robot",level:2},409);
    // Reproduce leaving a partially played game, then choosing another game.
    const daily=(await call({action:"start",profile:p.id,subject:"daily"})).profile.session;
    p=(await call({action:"game-start",profile:p.id,game:"robot",level:0})).profile;
    const robotId=p.session.id;
    const firstQuestion=questions.find(q=>q.id===p.session.question.id);
    p=(await call({action:"answer",profile:p.id,session:robotId,question:firstQuestion.id,answer:answerFor(firstQuestion)})).profile;
    const nextQuestionId=p.session.question.id;
    p=(await call({action:"hint",profile:p.id,session:robotId,question:nextQuestionId})).profile;
    const earnedStars=p.stars;
    p=(await call({action:"game-start",profile:p.id,game:"kitchen",level:0})).profile;
    const kitchenId=p.session.id;
    assert.equal(p.session.gameId,"kitchen","Choosing a different game must open that game");
    assert.equal(p.savedSessions.find(s=>s.id===robotId).index,1);
    assert.ok(p.savedSessions.every(s=>s.questions===undefined&&s.plan===undefined));
    await call({action:"answer",profile:p.id,session:robotId,question:nextQuestionId,answer:"0"},409);
    p=(await call()).profiles.find(item=>item.id===p.id);
    assert.ok(p.savedSessions.some(s=>s.id===robotId),"Saved game survives reload");
    p=(await call({action:"game-start",profile:p.id,game:"robot",level:0})).profile;
    assert.equal(p.session.id,robotId);
    assert.equal(p.session.index,1);
    assert.equal(p.session.question.id,nextQuestionId);
    assert.equal(p.session.hinted,true);
    assert.equal(p.stars,earnedStars,"Switching must not award duplicate stars");
    assert.ok(p.savedSessions.some(s=>s.id===kitchenId));
    await call({action:"session-resume",profile:p.id,session:"missing"},404);
    await call({action:"session-resume",profile:original.id==="maya"?"lydia":"maya",session:robotId},404);
    p=(await call({action:"session-resume",profile:p.id,session:daily.id})).profile;
    assert.equal(p.session.id,daily.id);
    p=await finish(p);
    for(const game of arcadeGames)for(let level=0;level<3;level++) {
      p=(await call({action:"game-start",profile:p.id,game:game.id,level})).profile;
      const id=p.session.id;
      assert.equal((await call({action:"game-start",profile:p.id,game:game.id,level})).profile.session.id,id);
      p=await finish(p);
      assert.ok(p.arcade[`${p.grade}:${game.id}`].levels.includes(level));
    }
    p=(await call({action:"favorite-game",profile:p.id,game:"robot",favorite:true})).profile;
    await call({action:"favorite-game",profile:p.id,game:"robot",favorite:true});
    const restored=(await call()).profiles.find(x=>x.id===p.id);
    assert.equal(restored.favorites.filter(id=>id==="robot").length,1);
    assert.equal(Object.values(restored.arcade).reduce((sum,g)=>sum+g.levels.length,0),24);
    p=(await call({action:"preferences",profile:p.id,autoRead:true,reducedMotion:true})).profile;
    assert.equal(p.preferences.autoRead,true);
    await call({action:"preferences",profile:p.id,autoRead:true,reducedMotion:true,paused:true});
    await call({action:"game-start",profile:p.id,game:"robot",level:0},403);
    await call({action:"session-resume",profile:p.id,session:robotId},403);
    await call({action:"preferences",profile:p.id,autoRead:true,reducedMotion:true,paused:false});
  }
  const owner=(await call()).profiles[0];
  const shelfBefore=await (await fetch(base+`/api/stories?profile=${owner.id}`)).json();
  assert.ok(shelfBefore.stories.every(s=>s.category!=='faith'));assert.equal(shelfBefore.prayers.length,0);
  const blockedStory=await fetch(base+'/api/stories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:owner.id,story:'creation',scene:1})});assert.equal(blockedStory.status,403);
  await workspace({action:'save-prayer',profile:owner.id,text:'Thank you for today.'},403);
  const observation=(await workspace({action:'save-observation',profile:owner.id,data:{experiment:'float',item:'cork',prediction:'Sink',reflection:'The cork floated. My prediction changed.'}},201)).item;
  assert.equal(observation.data.prediction,'Sink');
  await workspace({action:'save-observation',profile:owner.id,data:{experiment:'float',item:'fake',prediction:'Float',reflection:''}},400);
  const setData={title:'Parent adventure',questions:[{prompt:'What is 2 plus 3?',answer:'5',choices:['4','5','6'],hint:'Count on from two.',explanation:'Two and three make five.'}]};
  await workspace({action:'draft-set',profile:profiles[0].id,subject:'reading',level:1,count:5},403,'');
  const generated=await workspace({action:'draft-set',profile:profiles[0].id,subject:'reading',level:1,count:5});assert.equal(generated.draft.questions.length,5);
  await workspace({action:'draft-set',profile:profiles[0].id,subject:'reading',level:1,count:999},400);
  await workspace({action:'save-set',data:setData},403,'');
  const set=(await workspace({action:'save-set',data:setData},201)).item;
  let assigned=(await workspace({action:'assign',profile:owner.id,setId:set.id,due:null,badge:true},201)).item;
  assert.equal(assigned.question.answer,undefined);assert.equal(assigned.question.explanation,undefined);
  assigned=(await workspace({action:'answer-assignment',profile:owner.id,id:assigned.id,revision:assigned.revision,answer:'4'})).item;
  assert.equal(assigned.index,0);assert.equal(assigned.misses,1);
  await workspace({action:'answer-assignment',profile:profiles[1].id,id:assigned.id,revision:assigned.revision,answer:'5'},404);
  const completedAssignment=await workspace({action:'answer-assignment',profile:owner.id,id:assigned.id,revision:assigned.revision,answer:'5'});
  assert.ok(completedAssignment.item.completedAt);assert.equal(completedAssignment.item.question,null);
  await workspace({action:'answer-assignment',profile:owner.id,id:assigned.id,revision:assigned.revision,answer:'5'},409);
  const artwork={title:'Our rocket',mode:'drawing',template:'rocket',guide:'',caption:'Going to the Moon',marks:[{tool:'pencil',color:'#123456',size:8,points:[[40,50],[60,70]]}]};
  const art=(await workspace({action:'save-art',profile:owner.id,data:artwork},201)).item;
  const artList=await (await fetch(base+`/api/workspace?profile=${owner.id}&kind=art`)).json();assert.deepEqual(artList.items[0].data,artwork);
  assert.equal((await fetch(base+`/api/workspace?profile=${owner.id}&kind=art&page=-1`)).status,400);
  assert.equal((await (await fetch(base+`/api/workspace?profile=${owner.id}&kind=art&page=1`)).json()).items.length,0);
  await workspace({action:'save-art',profile:profiles[1].id,id:art.id,revision:art.revision,data:artwork},404);
  await workspace({action:'save-art',profile:owner.id,id:art.id,revision:art.revision,data:{...artwork,title:'A bigger rocket'}});
  await workspace({action:'save-art',profile:owner.id,id:art.id,revision:art.revision,data:artwork},409);
  await call({action:'controls',profile:owner.id,controls:{...owner.controls,faith:true,questLength:7,priorities:['math']}});
  assert.equal((await call()).profiles[0].controls.faith,true);
  const shelf=await (await fetch(base+`/api/stories?profile=${owner.id}`)).json();assert.equal(shelf.stories.filter(s=>s.category==='faith').length,14);assert.equal(shelf.prayers.length,9);
  for(const story of shelf.stories){for(let scene=0;scene<=story.scenes.length;scene++){const response=await fetch(base+'/api/stories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:owner.id,story:story.id,scene})});assert.equal(response.status,200);}}
  const completedShelf=await (await fetch(base+`/api/stories?profile=${owner.id}`)).json();assert.ok(completedShelf.progress.every(p=>p.completedAt));
  await workspace({action:'save-prayer',profile:owner.id,text:'Thank you for our family.'},201);
  await call({action:'reset-progress',profile:owner.id,target:'daily',confirm:'wrong'},400);
  await call({action:'reset-progress',profile:owner.id,target:'daily',confirm:owner.name});
  await call({action:'controls',profile:owner.id,controls:{...owner.controls,bedtime:'00:00'}});
  await call({action:'game-start',profile:owner.id,game:'robot',level:0},403);
  await workspace({action:'save-art',profile:owner.id,data:artwork},403);
  await call({action:'controls',profile:owner.id,controls:owner.controls});
  assert.equal((await fetch(base+`/api/workspace?profile=${owner.id}&kind=prayers`)).status,403);
  const exportAll=await (await fetch(base+'/api/parent/export',{headers:{Cookie:parentCookie}})).json();assert.ok(exportAll.collections.some(x=>x.id===art.id));
  const disposable=(await call()).profiles.at(-1);
  await workspace({action:'save-art',profile:disposable.id,data:artwork},201);
  await call({action:'delete-profile',profile:disposable.id,confirm:'wrong'},400);
  const afterDelete=await call({action:'delete-profile',profile:disposable.id,confirm:disposable.name});assert.equal(afterDelete.profiles.length,3);
  assert.equal((await fetch(base+`/api/workspace?profile=${disposable.id}&kind=art`)).status,404);
  await parentCall({action:"lock"});
  await call({action:"offline-confirm",profile:profiles[0].id},403);
  await call({action:'reset-progress',profile:owner.id,target:'all',confirm:owner.name},403);
  await call({action:'delete-profile',profile:owner.id,confirm:owner.name},403);
  console.log("PASS: 48 game missions, saved sessions, Team Quest, parent PIN/security, curriculum drafts, assignments/private scoring, artwork/pagination/conflicts, all story scenes, faith controls/prayers, science notebooks, schedules, reset/deletion/export, and persistence.");
  console.log("Isolated test state: "+state);
} finally {
  child.kill();
}
