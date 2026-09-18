import assert from 'node:assert/strict';

// Runs only against the isolated integration database; never a family workspace.
export async function verifyReadingFlow({base,call,parentCookie}) {
  const child=(await call({action:'create-profile',name:'Reading Maya',grade:'prek',avatar:'fox',interests:[],dailyGoal:10},201)).profile;
  await call({action:'controls',profile:child.id,controls:{...child.controls,age:4}});
  let state=await (await fetch(`${base}/api/reading?profile=${child.id}`)).json();
  assert.equal(state.profile.level,'beginning-pre-reader');
  assert.equal(state.catalog.stories[0].answer,undefined);
  async function act(action,response,expected=200,extra={}){
    const res=await fetch(base+'/api/reading',{method:'POST',headers:{'Content-Type':'application/json',Cookie:parentCookie},body:JSON.stringify({action,profile:child.id,revision:state.revision,session:state.session?.id,activity:state.session?.activity?.id,response,...extra})});
    const result=await res.json();assert.equal(res.status,expected,JSON.stringify(result));if(expected===200)state=result;return result;
  }
  await act('start');assert.equal(state.session.kind,'placement');assert.equal(state.session.activities,undefined);
  await act('skip');await act('skip');assert.equal(state.profile.placementDone,true);assert.equal(state.profile.level,'beginning-pre-reader');
  await act('start');assert.equal(state.session.activity.target,'m');
  await act('answer','m',409); // teaching cannot be bypassed
  for(const letter of ['m','s','a','t']){
    assert.equal(state.session.activity.target,letter);await act('teach');
    const stale=state.revision;await act('answer',letter);await act('start',undefined,409,{revision:stale});
    assert.equal(state.profile.mastery['sound_'+letter].independent,0);
  }
  assert.equal(state.session.activity.kind,'blend-train');assert.equal(state.session.activity.target,'mat');await act('answer','mat');
  assert.equal(state.session.activity.kind,'sound-boxes');await act('answer','zoo',400);await act('answer','mat');
  assert.equal(state.session.activity.kind,'story');assert.deepEqual(state.catalog.stories[0].pages,['Sam!','Sam sat.']);
  await act('answer','sat',409);await act('story-page');await act('story-page');
  const before=state.stars,completion={action:'answer',profile:child.id,revision:state.revision,session:state.session.id,activity:state.session.activity.id,response:'sat'};
  const concurrent=await Promise.all([0,1].map(()=>fetch(base+'/api/reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(completion)})));
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  state=await concurrent.find(r=>r.status===200).json();assert.equal(state.stars,before+3);assert.equal(state.profile.sessionsCompleted,1);assert.deepEqual(state.profile.books,['sam-sat']);
  const reopened=await (await fetch(`${base}/api/reading?profile=${child.id}`)).json();assert.deepEqual(reopened.profile,state.profile);assert.ok(reopened.session.completedAt);
  const exported=await (await fetch(base+'/api/parent/export',{headers:{Cookie:parentCookie}})).json();
  assert.equal(exported.reading.profiles.find(p=>p.child_id===child.id).data.sessionsCompleted,1);
  const attempts=exported.reading.attempts.filter(a=>a.childId===child.id);assert.equal(attempts.length,9);assert.equal(attempts.filter(a=>a.kind==='story').length,1);
  await call({action:'preferences',profile:child.id,...child.preferences,paused:true});await act('start',undefined,403);await call({action:'preferences',profile:child.id,...child.preferences,paused:false});
  const noParent=await fetch(base+'/api/reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reset',profile:child.id,revision:state.revision,confirm:child.name})});assert.equal(noParent.status,403);
  await act('reset',undefined,400,{confirm:'wrong'});await act('reset',undefined,200,{confirm:child.name});assert.equal(state.profile.placementDone,false);assert.equal(state.stars,before+3);
  await call({action:'reset-progress',profile:child.id,target:'all',confirm:child.name});
  const cleared=await (await fetch(base+'/api/parent/export',{headers:{Cookie:parentCookie}})).json();assert.equal(cleared.reading.attempts.filter(a=>a.childId===child.id).length,0);
  await fetch(`${base}/api/reading?profile=${child.id}`);
  await call({action:'delete-profile',profile:child.id,confirm:child.name});assert.equal((await fetch(`${base}/api/reading?profile=${child.id}`)).status,404);
  console.log('PASS: Reading Maya placement → m/s/a/t → blend/build mat → Sam sat; persistence, private answers, help evidence, reward race, pause, reset, export, and deletion.');
}
