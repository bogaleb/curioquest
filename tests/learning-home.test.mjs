import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
const {learningHome,offscreenInvitation}=loadTs('lib/learning-home');
const {newExplorer}=loadTs('lib/explorers');
const {emptyMastery}=loadTs('lib/mastery');

test('home counts recorded practice rather than scores, empty records or unknown skills',()=>{
 const profile=newExplorer('test','Explorer','prek','fox');
 profile.skillMastery={
  'LIT.PK.ORAL.WORD_01':{...emptyMastery(),attemptCount:1,score:0},
  'LIT.PK.PA.RHYME_01':{...emptyMastery(),score:100},
  'unreviewed-skill':{...emptyMastery(),attemptCount:20},
 };
 const before=JSON.stringify(profile);
 // Every registered subject gets a counter, so a new subject cannot silently
 // vanish from the home tally.
 const {allSubjects}=loadTs('lib/subjects');
 const practiced=learningHome(profile).practiced;
 assert.deepEqual(Object.keys(practiced).sort(),[...allSubjects].sort());
 assert.equal(practiced.reading,1);
 for(const subject of allSubjects.filter(s=>s!=='reading')) assert.equal(practiced[subject],0);
 assert.equal(JSON.stringify(profile),before);
});

test('home offers only an unfinished current quest for direct resume',()=>{
 const profile=newExplorer('test','Explorer','grade1','fox');
 assert.equal(learningHome(profile).active,null);
 profile.session={id:'saved',index:2,total:4};
 assert.equal(learningHome(profile).active.id,'saved');
 profile.session.index=4;
 assert.equal(learningHome(profile).active,null);
});

test('home follows the selected learning track, not chronological age',()=>{
 const profile=newExplorer('test','Explorer','prek','fox');profile.controls.age=7;
 assert.equal(learningHome(profile).gradeLabel,'Pre-K explorer');
 assert.match(offscreenInvitation(profile.grade).text,/Touch each leaf as you count/);
 profile.grade='grade1';
 assert.match(offscreenInvitation(profile.grade).text,/two groups/);
});
