import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
const {defaultReadingCatalog:c}=loadTs('lib/reading/content');
const {newReadingProfile,updateReadingMastery,getDecodableWords}=loadTs('lib/reading/engine');
const {buildDailyAdventure,collectorRound,experienceAttempt}=loadTs('lib/experience/engine');
const {mediaAssets,mediaCues,worldItems}=loadTs('lib/experience/content');
test('V1 seeds five media records, one real episode, four cues and eight original artifacts',()=>{
 assert.equal(mediaAssets.length,5);assert.equal(mediaAssets.filter(m=>m.active).length,1);assert.equal(worldItems.length,8);
 const episode=mediaAssets.find(m=>m.active);assert.equal(episode.scenes.length,7);assert.equal(episode.videoUrl,null);
 for(const cue of mediaCues){assert.ok(episode.scenes[cue.scene]);assert.ok(cue.at<episode.scenes[cue.scene].duration);assert.ok(c.skills.some(s=>s.id===cue.skillId));if(cue.kind!=='sequence')assert.ok(cue.choices.includes(cue.answer));}
});
test('fresh learners meet prerequisite sounds in the preserved sequence before the map experience',()=>{
 const p=newReadingProfile(),run=buildDailyAdventure(p,c,'daily','2026-09-18','demo');assert.deepEqual(run.warmup,['m','s','a','t','p']);assert.deepEqual(run.steps,['episode','blend','collector','story','reward','treehouse','offline']);
 for(const letter of run.warmup)updateReadingMastery(p,experienceAttempt('maya',run,'sound_'+letter,letter,letter,true,true),c);
 assert.ok(getDecodableWords(p,c).some(w=>w.id==='map'));assert.ok(getDecodableWords(p,c).some(w=>w.id==='sat'));
 const next=buildDailyAdventure(p,c,'daily','2026-09-18','next');assert.deepEqual(next.warmup,[]);
});
test('collector has one target, three distractors, unique cards and mapped evidence',()=>{
 const run=buildDailyAdventure(newReadingProfile(),c,'game','today','demo');
 for(let i=0;i<3;i++){run.round=i;const round=collectorRound(run);assert.equal(round.choices.length,4);assert.equal(new Set(round.choices.map(x=>x.id)).size,4);assert.ok(round.choices.some(x=>x.id===round.target));assert.equal(round.skillId,'blend_cvc');}
 const independent=experienceAttempt('maya',run,'blend_cvc','map','map',true,false);assert.equal(independent.evidence,'independent-choice');
 run.help=2;assert.equal(experienceAttempt('maya',run,'blend_cvc','map','map',true,false).evidence,'supported-practice');
});
