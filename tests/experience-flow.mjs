import assert from 'node:assert/strict';
export async function verifyExperienceFlow({base,call,parentCookie}){
 const child=(await call({action:'create-profile',name:'World explorer',grade:'prek',avatar:'fox',dailyGoal:10,interests:['space']},201)).profile;
 let data=await(await fetch(base+`/api/experience?profile=${child.id}`)).json();assert.equal(data.media.length,5);assert.equal(data.inventory.length,0);
 async function act(action,extra={},expected=200){const r=await fetch(base+'/api/experience',{method:'POST',headers:{'Content-Type':'application/json',Cookie:parentCookie},body:JSON.stringify({action,profile:child.id,mode:'daily',revision:data.revision,run:data.run?.id,...extra})});const next=await r.json();assert.equal(r.status,expected,JSON.stringify(next));if(expected===200)data=next;return next;}
 await act('place',{slot:'wall',item:'explorer-map'},400);await act('start');await act('claim',{},409);
 let observations=0;
 while(data.warmup){await act('answer',{response:data.warmup.target});observations++;assert.ok(observations<=15);}
 for(let scene=0;scene<7;scene++){
  assert.equal(data.run.scene,scene);await act('next-scene',{},409);
  await act('tick',{time:999});
  if(data.cue){assert.equal(data.cue.answer,undefined);const answer={'find-m':'m','tap-map':'map','blend-map':'map','read-map':'map'}[data.cue.id];
   const before=data.revision;await act('answer',{response:answer});observations++;await act('answer',{response:answer,revision:before},409);await act('tick',{time:999});
  }
  await act('next-scene');
 }
 assert.equal(data.step,'blend');assert.ok(data.inventory.some(i=>i.item_id==='explorer-map'));
 await act('answer',{response:data.word.id});observations++;
 assert.equal(data.step,'collector');for(const target of ['map','mat','sat']){await act('answer',{response:target});observations++;}
 assert.equal(data.step,'story');await act('answer',{response:'sat'},409);await act('story-page');await act('story-page');await act('answer',{response:'sat'});observations++;
 assert.equal(data.step,'reward');const stars=data.stars;await act('claim');assert.equal(data.stars,stars);assert.equal(data.step,'treehouse');
 const payload={action:'place',profile:child.id,mode:'daily',revision:data.revision,run:data.run.id,slot:'wall',item:'explorer-map'};
 const race=await Promise.all([0,1].map(()=>fetch(base+'/api/experience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})));assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);data=await race.find(r=>r.status===200).json();
 assert.equal(data.step,'offline');assert.ok(data.inventory.some(i=>i.item_id==='moon-lamp'));assert.ok(data.inventory.some(i=>i.item_id==='robot-toy'));
 await act('place',{slot:'shelf',item:'moon-lamp'});await act('place',{slot:'desk',item:'robot-toy'});
 const reopened=await(await fetch(base+`/api/experience?profile=${child.id}`)).json();assert.deepEqual(reopened.placements,data.placements);assert.equal(reopened.placements.length,3);
 await act('offline');assert.ok(data.run.completedAt);
 const forbidden=await fetch(base+'/api/experience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'confirm-offline',profile:child.id,revision:data.revision})});assert.equal(forbidden.status,403);
 await act('confirm-offline');assert.ok(data.inventory.some(i=>i.item_id==='discovery-plant'));
 const report=await(await fetch(base+'/api/parent/export',{headers:{Cookie:parentCookie}})).json();assert.equal(report.experience.responses.filter(a=>a.childId===child.id).length,observations);assert.ok(report.reading.profiles.find(p=>p.child_id===child.id).data.mastery.blend_cvc.attempts>0);
 await act('favorite',{media:'missing-map'});assert.deepEqual(data.state.favoriteMedia,['missing-map']);
 await call({action:'preferences',profile:child.id,...child.preferences,paused:true});await act('start',{},403);await call({action:'preferences',profile:child.id,...child.preferences,paused:false});
 await call({action:'delete-profile',profile:child.id,confirm:child.name});assert.equal((await fetch(base+`/api/experience?profile=${child.id}`)).status,404);
 const deleted=await(await fetch(base+'/api/parent/export',{headers:{Cookie:parentCookie}})).json();assert.equal(deleted.experience.inventory.filter(i=>i.child_id===child.id).length,0);
 console.log('PASS: Interactive V1 sound preparation → four media cues → Blend Train → Space Collector → Sam Sat → reward → three persisted treehouse slots → parent-confirmed offline mission; shared mastery, reward race, favorites, pause, export, deletion.');
}
