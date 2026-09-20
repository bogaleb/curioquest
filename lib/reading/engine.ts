import type {ReadingActivity,ReadingAttempt,ReadingCatalog,ReadingMastery,ReadingProfile,ReadingSession,ReadingWord} from './types';
export function newReadingProfile():ReadingProfile{return {version:1,level:'beginning-pre-reader',placementDone:false,introduced:[],mastery:{},session:null,sessionsCompleted:0,books:[],recentWords:[],lastMutation:'',events:[]};}
export function emptyReadingMastery():ReadingMastery{return {score:0,attempts:0,correct:0,independent:0,helpUsed:0,days:[],lastPracticed:null,reviewAt:null,retained:0};}
export function readySkills(profile:ReadingProfile,catalog:ReadingCatalog){return new Set(Object.entries(profile.mastery).filter(([,m])=>m.correct>0&&m.score>=catalog.settings.readyScore).map(([id])=>id));}
export function getDecodableWords(profile:ReadingProfile,catalog:ReadingCatalog):ReadingWord[]{const known=readySkills(profile,catalog);return catalog.words.filter(w=>w.requiredSkills.every(id=>known.has(id)));}
export function sentenceIsDecodable(sentence:string,known:Set<string>,catalog:ReadingCatalog){const tokens=sentence.toLowerCase().match(/[a-z]+/g)??[];return tokens.length>0&&tokens.every(token=>{const word=catalog.words.find(w=>w.word.toLowerCase()===token);return !!word&&word.requiredSkills.every(id=>known.has(id));});}
export function getDecodableStories(profile:ReadingProfile,catalog:ReadingCatalog){const known=readySkills(profile,catalog);return catalog.stories.filter(story=>story.requiredSkills.every(id=>known.has(id))&&story.pages.every(page=>sentenceIsDecodable(page,known,catalog)));}
export function getSkillsDueForReview(profile:ReadingProfile,now=new Date()){return Object.entries(profile.mastery).filter(([,m])=>m.reviewAt&&Date.parse(m.reviewAt)<=now.getTime()).sort((a,b)=>(a[1].reviewAt??'').localeCompare(b[1].reviewAt??'')).map(([id])=>id);}
export function readingState(m:ReadingMastery|undefined,catalog:Pick<ReadingCatalog,'settings'>,now=new Date()){if(!m?.attempts)return 'Not started';if(m.reviewAt&&Date.parse(m.reviewAt)<=now.getTime())return 'Needs review';if(m.score>=catalog.settings.masteredScore&&m.days.length>=3&&m.independent>=4&&m.retained>=1)return 'Mastered';if(m.score>=.65)return 'Strong';if(m.score>=.4)return 'Developing';return 'Emerging';}
export function classifyReadingError(target:string,response:string,kind:ReadingActivity['kind']){if(target.toLowerCase()===response.toLowerCase())return null;if(kind==='letter-catch')return 'letter_sound_confusion';if(kind==='story')return 'story_detail_confusion';const a=target.toLowerCase(),b=response.toLowerCase();if(a.length!==b.length)return 'sound_sequence_incomplete';if(a.slice(0,-1)===b.slice(0,-1))return 'final_phoneme_confusion';if(a.slice(1)===b.slice(1))return 'initial_phoneme_confusion';if(a.length===3&&a[0]===b[0]&&a[2]===b[2])return 'vowel_confusion';return 'sound_sequence_confusion';}
export function updateReadingMastery(profile:ReadingProfile,attempt:ReadingAttempt,catalog:ReadingCatalog){
  // One first response per activity is one evidence observation. Retrying stays in the audit trail.
  if(attempt.attemptNumber!==1)return;
  const old=profile.mastery[attempt.skillId]??emptyReadingMastery(),now=new Date(attempt.createdAt),independent=attempt.correct&&attempt.evidence==='independent-choice'&&attempt.helpLevel===0;
  const quality=attempt.correct?(independent?1:attempt.helpLevel>=4?.18:attempt.helpLevel>=2?.45:.65):.1;
  const score=old.attempts?old.score*.7+quality*.3:quality*.55;
  const due=!!old.reviewAt&&Date.parse(old.reviewAt)<=now.getTime(),retained=independent?(old.retained+(due?1:0)):0;
  const review=new Date(now);review.setUTCDate(review.getUTCDate()+catalog.settings.reviewDays[Math.min(retained,catalog.settings.reviewDays.length-1)]);
  profile.mastery[attempt.skillId]={score:Math.round(score*1000)/1000,attempts:old.attempts+1,correct:old.correct+(attempt.correct?1:0),independent:old.independent+(independent?1:0),helpUsed:old.helpUsed+attempt.helpLevel,days:[...new Set([...old.days,attempt.createdAt.slice(0,10)])].slice(-30),lastPracticed:attempt.createdAt,reviewAt:!due&&independent&&old.reviewAt?old.reviewAt:review.toISOString(),retained};
}
function activity(id:string,kind:ReadingActivity['kind'],skillId:string,target:string,choices:string[],reason:ReadingActivity['reason'],taught=false):ReadingActivity{return {id,kind,skillId,target,choices,reason,taught};}
/**
 * Distractors for a letter, drawn from its neighbours in the sequence.
 *
 * This used to slice from the front of the sequence, which was harmless at seven letters
 * and became silly at nineteen: a child meeting `l` was asked to choose between l, s and
 * m — the first two sounds they ever learned, and nothing like it. The letters worth
 * telling apart are the ones taught near each other, because those are the ones a child
 * is currently holding in mind at the same time.
 */
function nearbyLetters(letter:string,index:number,catalog:ReadingCatalog){
  const sequence=catalog.settings.sequence,position=sequence.indexOf(letter as typeof sequence[number]);
  const near=sequence.filter((l,i)=>l!==letter&&position>=0&&Math.abs(i-position)<=3);
  const pool=near.length>=2?near:sequence.filter(l=>l!==letter);
  return [pool[index%pool.length],pool[(index+1)%pool.length]];
}
export function letterActivity(letter:string,index:number,reason:ReadingActivity['reason'],catalog:ReadingCatalog,taught=false){const choices=[letter,...nearbyLetters(letter,index,catalog)];return activity(`letter-${letter}-${index}`,'letter-catch',`sound_${letter}`,letter,choices.slice(index%3).concat(choices.slice(0,index%3)),reason,taught);}
export function buildReadingSession(profile:ReadingProfile,catalog:ReadingCatalog,id:string,now=new Date()):ReadingSession{
  const at=now.toISOString();let activities:ReadingActivity[];
  if(!profile.placementDone)activities=[letterActivity('m',0,'placement',catalog),letterActivity('s',1,'placement',catalog),activity('placement-blend','blend-train','blend_cvc','mat',['sat','mat','map'],'placement')];
  else {
    const due=getSkillsDueForReview(profile,now),ready=readySkills(profile,catalog),newLetters=catalog.settings.sequence.filter(l=>!ready.has(`sound_${l}`)).slice(0,4);
    const reviewLetters=due.filter(id=>id.startsWith('sound_')&&!newLetters.includes(id.slice(6) as typeof newLetters[number])).slice(0,2);
    activities=reviewLetters.map((skill,i)=>letterActivity(skill.slice(6),i,'review',catalog));
    for(const letter of newLetters)activities.push(letterActivity(letter,activities.length,'new',catalog,true));
    if(!activities.length)for(const letter of catalog.settings.sequence.slice(profile.sessionsCompleted%4,profile.sessionsCompleted%4+2))activities.push(letterActivity(letter,activities.length,'practice',catalog));
    // Prerequisites are checked again before each activity, not assumed from a planned lesson.
    const projected=new Set([...ready,...newLetters.map(l=>`sound_${l}`)]);
    const eligible=catalog.words.filter(w=>w.pattern==='CVC'&&w.requiredSkills.every(skill=>projected.has(skill)));
    const word=eligible.find(w=>w.id==='mat'&&!profile.recentWords.includes(w.id))??eligible.find(w=>!profile.recentWords.includes(w.id))??eligible[0];
    if(word){activities.push(activity('blend','blend-train','blend_cvc',word.id,[word.id,...eligible.filter(w=>w.id!==word.id).slice(0,2).map(w=>w.id)],'practice'));activities.push(activity('build','sound-boxes','build_cvc',word.id,[...word.graphemes,...nearbyLetters(word.graphemes[0],activities.length,catalog).filter(l=>!word.graphemes.includes(l))].reverse(),'practice'));}
    const story=catalog.stories.find(s=>s.requiredSkills.filter(id=>id!=='blend_cvc').every(id=>projected.has(id)));
    if(story)activities.push(activity('story','story','story_detail',story.id,story.choices,'practice'));
  }
  return {id,kind:profile.placementDone?'quest':'placement',activities,index:0,helpLevel:0,misses:0,startedAt:at,activityStartedAt:at,storyPage:0,completedAt:null,placementMisses:0};
}
export function activityReady(a:ReadingActivity,profile:ReadingProfile,catalog:ReadingCatalog){if(a.reason==='placement'||a.kind==='letter-catch')return true;if(a.kind==='story')return getDecodableStories(profile,catalog).some(s=>s.id===a.target);const word=getDecodableWords(profile,catalog).find(w=>w.id===a.target);if(!word)return false;return a.kind!=='sound-boxes'||readySkills(profile,catalog).has('blend_cvc');}
export function advanceReadingSession(profile:ReadingProfile,catalog:ReadingCatalog,now=new Date()){
  const session=profile.session!;session.index++;session.helpLevel=0;session.misses=0;session.storyPage=0;session.activityStartedAt=now.toISOString();
  if(session.kind==='placement'&&session.placementMisses>=2)session.index=session.activities.length;
  while(session.index<session.activities.length&&!activityReady(session.activities[session.index],profile,catalog))session.index++;
  if(session.index===session.activities.length){session.completedAt=now.toISOString();if(session.kind==='placement'){profile.placementDone=true;profile.level=(profile.mastery.blend_cvc?.score??0)>=catalog.settings.readyScore?'early-blending':'beginning-pre-reader';}else profile.sessionsCompleted++;return true;}return false;
}
