import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
import {solveRoute} from './solve-route.mjs';
import {verifyReadingFlow} from './reading-flow.mjs';
import {verifyExperienceFlow} from './experience-flow.mjs';
export async function verifyApplicationFlow(sql) {
const base='http://curioquest.test';
const {questions}=loadTs('lib/curriculum');
const {arcadeGames}=loadTs('lib/arcade');
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
  let {profiles}=await call();
  assert.equal(profiles.length,0);
  assert.equal((await fetch(base+"/api/parent/export")).status,403);
  await call({action:"create-profile",name:"Blocked",grade:"prek",avatar:"owl",interests:[],dailyGoal:10},403);
  const setup=await parentCall({action:"setup",pin:"482619"});
  assert.equal(setup.recoveryCode.length,64);
  await call({action:'create-profile',name:'Maya',grade:'grade1',avatar:'fox',interests:['stories','puzzles'],dailyGoal:10},201);
  await call({action:'create-profile',name:'Lydia',grade:'prek',avatar:'rabbit',interests:['animals','nature'],dailyGoal:8},201);
  profiles=(await call()).profiles;

  const strangerHeaders={'x-test-actor':'other',Cookie:parentCookie};
  assert.deepEqual((await(await fetch(base+'/api/quest',{headers:strangerHeaders})).json()).profiles,[]);
  assert.equal((await fetch(base+'/api/parent/export',{headers:strangerHeaders})).status,403);
  assert.equal((await fetch(base+'/api/quest',{method:'POST',headers:{...strangerHeaders,'Content-Type':'application/json'},body:JSON.stringify({action:'start',profile:profiles[0].id,subject:'daily'})})).status,404);
  assert.equal((await fetch(base+'/api/quest',{headers:{'x-test-actor':'anonymous','oai-authenticated-user-id':'forged'}})).status,401);
  const exported=await fetch(base+"/api/parent/export",{headers:{Cookie:parentCookie}});
  assert.equal(exported.status,200);assert.equal((await exported.json()).profiles.length,2);
  await parentCall({action:"setup",pin:"123456"},409);
  await parentCall({action:"lock"});
  await call({action:"preferences",profile:profiles[0].id,autoRead:true,reducedMotion:true},403);
  for(let i=0;i<5;i++)await parentCall({action:"unlock",pin:"000000"},403);
  await parentCall({action:"unlock",pin:"482619"},429);
  // Advance the isolated rate-limit window, never the user's database.
  sql("update private.parent_gates set window_until=now()-interval '1 minute';");
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
    await call({action:"session-resume",profile:profiles.find(p=>p.id!==original.id).id,session:robotId},404);
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
    // Derived, not hard-coded: this read 24 while the arcade had grown to eleven games,
    // so the check had been failing on a number that was simply out of date.
    assert.equal(Object.values(restored.arcade).reduce((sum,g)=>sum+g.levels.length,0),arcadeGames.length*3);
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
  await verifyLearningEvents({sql,call,questions,answerFor,profileId:owner.id});
  await verifyReadingFlow({base,call,parentCookie});
  await verifyExperienceFlow({base,call,parentCookie});
  await parentCall({action:"lock"});
  await call({action:"offline-confirm",profile:profiles[0].id},403);
  await call({action:'reset-progress',profile:owner.id,target:'all',confirm:owner.name},403);
  await call({action:'delete-profile',profile:owner.id,confirm:owner.name},403);
  console.log(`PASS: learning events, ${arcadeGames.length*3} game missions, saved sessions, Team Quest, parent PIN/security, curriculum drafts, assignments/private scoring, artwork/pagination/conflicts, all story scenes, faith controls/prayers, science notebooks, schedules, reset/deletion/export, and persistence.`);

}

/**
 * WP-01 acceptance: a full daily quest produces one row per attempt, with the right
 * verb, support, correctness and latency — written to real PostgreSQL by the real
 * route handler, not by a fixture.
 */
async function verifyLearningEvents({sql,call,questions,answerFor,profileId}) {
  // Run as the cluster owner rather than service_role: these are verification queries
  // against the table directly, and service_role holds execute grants on the RPCs, not
  // table privileges — which is itself the point of the RLS probes in rls.sql.
  const rows = (expression) => sql("reset role; " + expression).trim();
  const before = Number(rows("select count(*) from public.learning_events where child_id='" + profileId + "';"));

  let p = (await call({action:"start",profile:profileId,subject:"daily"})).profile;
  const sessionId = p.session.id;
  const planned = p.session.total ?? p.session.questions?.length;
  let attempts = 0, wrongAttempts = 0;

  // One deliberate wrong answer, so the stream is checked for what it records about a
  // mistake as well as about a success. A stream that only captured correct answers
  // would be useless for every question the product exists to answer.
  let firstWrong = true;
  while (p.session?.question) {
    const shown = p.session.question;
    const full = questions.find(item => item.id === shown.id);
    if (firstWrong && shown.options.length > 1) {
      const wrong = shown.options.find(option => option !== full.answer);
      p = (await call({action:"answer",profile:profileId,session:sessionId,question:full.id,answer:wrong})).profile;
      attempts++; wrongAttempts++; firstWrong = false;
    }
    p = (await call({action:"answer",profile:profileId,session:sessionId,question:full.id,answer:answerFor(full)})).profile;
    attempts++;
  }

  const recorded = Number(rows("select count(*) from public.learning_events where session_id='" + sessionId + "';"));
  assert.equal(recorded, attempts, "expected one event per attempt, including the retry");
  assert.ok(recorded > (planned ?? 0), "the retry must be recorded as its own row");
  assert.equal(
    Number(rows("select count(*) from public.learning_events where session_id='" + sessionId + "' and correct=false;")),
    wrongAttempts);
  assert.equal(
    Number(rows("select count(*) from public.learning_events where child_id='" + profileId + "';")) - before,
    attempts);

  // Every row is usable: no null verb, no null support, a real catalogue version, and
  // a latency that was measured from the activity rather than from the session.
  assert.equal(rows("select count(*) from public.learning_events where session_id='" + sessionId +
    "' and (verb is null or support is null or catalogue_ver is null);"), "0");
  assert.equal(rows("select count(*) from public.learning_events where session_id='" + sessionId +
    "' and latency_ms is null;"), "0", "every attempt should carry a response latency");
  assert.equal(rows("select count(*) from public.learning_events where session_id='" + sessionId +
    "' and latency_ms > 600000;"), "0", "latency measured from the session start would be far larger");

  // The verbs recorded are the ones the engines actually exercise, not all `choose`.
  const verbs = rows("select string_agg(distinct verb,',' order by verb) from public.learning_events where session_id='" + sessionId + "';");
  assert.ok(verbs.length > 0, "no verbs recorded");

  // A correct answer carries no distractor or error kind; a wrong one carries the
  // response that was given.
  assert.equal(rows("select count(*) from public.learning_events where session_id='" + sessionId +
    "' and correct=true and (distractor is not null or error_kind is not null);"), "0");
  assert.equal(rows("select count(*) from public.learning_events where session_id='" + sessionId +
    "' and correct=false and distractor is null;"), "0");

  // Append-only is enforced by the database, not merely by convention.
  let updated = false;
  try { rows("update public.learning_events set correct=false where session_id='" + sessionId + "';"); updated = true; }
  catch { /* expected */ }
  assert.ok(!updated, "learning_events must reject updates even for the service role");

  // Replay is idempotent, which is what an offline queue drain depends on (WP-12).
  const id = rows("select id from public.learning_events where session_id='" + sessionId + "' limit 1;");
  const duplicate = rows("select private.cq_append_events('" + profileId + "'," +
    "(select jsonb_build_array(jsonb_build_object('id',id,'sessionId',session_id,'skillId',skill_id," +
    "'itemId',item_id,'verb',verb,'phase',phase,'correct',correct,'support',support," +
    "'catalogueVersion',catalogue_ver)) from public.learning_events where id='" + id + "'));");
  assert.equal(duplicate, "0", "replaying an event already stored must insert nothing");

  console.log("PASS: learning events — " + recorded + " rows for one quest, append-only, idempotent on replay.");
}
