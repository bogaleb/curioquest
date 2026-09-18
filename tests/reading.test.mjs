import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
const {defaultReadingCatalog:c}=loadTs('lib/reading/content');
const {newReadingProfile,readySkills,getDecodableWords,getDecodableStories,sentenceIsDecodable,buildReadingSession,updateReadingMastery,advanceReadingSession,readingState,classifyReadingError,getSkillsDueForReview}=loadTs('lib/reading/engine');
const now=new Date('2026-09-18T12:00:00Z');
function attempt(skill='sound_m',changes={}){return {id:'attempt',childId:'maya',sessionId:'session',activityId:'activity',kind:'letter-catch',skillId:skill,stimulus:'m',response:'m',correct:true,helpLevel:0,attemptNumber:1,responseTimeMs:3000,errorType:null,evidence:'independent-choice',createdAt:now.toISOString(),...changes};}
test('reading content is connected, decodable, and uses the specified first sounds',()=>{
  assert.deepEqual(c.settings.sequence,['m','s','a','t','p','i','n']);
  const ids=new Set(c.skills.map(s=>s.id));assert.equal(ids.size,c.skills.length);
  for(const skill of c.skills)assert.ok(skill.prerequisites.every(id=>ids.has(id)));
  for(const word of c.words){assert.equal(word.graphemes.join(''),word.word.toLowerCase());assert.equal(word.phonemes.length,word.graphemes.length);assert.ok(word.requiredSkills.every(id=>ids.has(id)));}
  for(const story of c.stories){assert.ok(story.pages.every(page=>sentenceIsDecodable(page,new Set(story.requiredSkills),c)));assert.ok(story.choices.includes(story.answer));}
});
test('untaught words and unlisted spellings cannot enter the decodable shelf',()=>{
  const p=newReadingProfile();assert.equal(getDecodableWords(p,c).length,0);
  for(const l of ['m','s','a','t'])updateReadingMastery(p,attempt('sound_'+l),c);
  assert.ok(getDecodableWords(p,c).some(w=>w.id==='mat'));assert.ok(!getDecodableWords(p,c).some(w=>w.id==='pin'));
  assert.equal(sentenceIsDecodable('Sam sat.',readySkills(p,c),c),true);
  assert.equal(sentenceIsDecodable('Sam sat on the mat.',readySkills(p,c),c),false);
  assert.equal(getDecodableStories(p,c).length,0);
  updateReadingMastery(p,attempt('blend_cvc'),c);assert.equal(getDecodableStories(p,c).length,1);
});
test('guided answers, help, and retries cannot masquerade as independent mastery',()=>{
  const a=newReadingProfile(),b=newReadingProfile();
  updateReadingMastery(a,attempt(),c);updateReadingMastery(b,attempt('sound_m',{helpLevel:4,evidence:'supported-practice'}),c);
  assert.ok(a.mastery.sound_m.score>b.mastery.sound_m.score);assert.equal(b.mastery.sound_m.independent,0);
  const before=structuredClone(a.mastery);updateReadingMastery(a,attempt('sound_m',{attemptNumber:2}),c);assert.deepEqual(a.mastery,before);
  for(let i=0;i<30;i++)updateReadingMastery(a,attempt(),c);
  assert.notEqual(readingState(a.mastery.sound_m,c,now),'Mastered');
});
test('delayed independent review is required and same-day practice does not postpone it',()=>{
  const p=newReadingProfile();updateReadingMastery(p,attempt(),c);const due=p.mastery.sound_m.reviewAt;
  updateReadingMastery(p,attempt('sound_m',{createdAt:'2026-09-18T18:00:00Z'}),c);assert.equal(p.mastery.sound_m.reviewAt,due);
  assert.deepEqual(getSkillsDueForReview(p,new Date('2026-09-20')),['sound_m']);
  updateReadingMastery(p,attempt('sound_m',{createdAt:'2026-09-20T12:00:00Z'}),c);assert.equal(p.mastery.sound_m.retained,1);
  p.placementDone=true;const session=buildReadingSession(p,c,'review',new Date('2026-09-25'));
  assert.equal(session.activities[0].reason,'review');assert.equal(session.activities[0].target,'m');
});
test('beginner vertical slice teaches m s a t, blends and builds mat, then reads Sam sat',()=>{
  const p=newReadingProfile();p.placementDone=true;p.session=buildReadingSession(p,c,'quest',now);
  assert.deepEqual(p.session.activities.slice(0,4).map(a=>a.target),['m','s','a','t']);
  const kinds=[];
  while(!p.session.completedAt){const a=p.session.activities[p.session.index];kinds.push(a.kind);updateReadingMastery(p,attempt(a.skillId,{evidence:a.taught||a.kind==='blend-train'?'supported-practice':'independent-choice'}),c);advanceReadingSession(p,c,now);}
  assert.deepEqual(kinds,['letter-catch','letter-catch','letter-catch','letter-catch','blend-train','sound-boxes','story']);assert.equal(p.sessionsCompleted,1);
});
test('error labels distinguish initial, vowel, and final sound substitutions',()=>{
  assert.equal(classifyReadingError('mat','sat','sound-boxes'),'initial_phoneme_confusion');
  assert.equal(classifyReadingError('mat','mit','sound-boxes'),'vowel_confusion');
  assert.equal(classifyReadingError('mat','map','sound-boxes'),'final_phoneme_confusion');
});
