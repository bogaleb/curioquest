import type {ReadingCatalog,ReadingProfile,ReadingAttempt} from '@/lib/reading/types';
import {readySkills,getSkillsDueForReview,getDecodableWords} from '@/lib/reading/engine';
import type {AdventureRun,ExperienceState,CollectorRound,RunMode} from './types';
export const newExperience=():ExperienceState=>({runs:{},favoriteMedia:[],watched:[],gameCompletions:0,offlineRequestedAt:null,offlineConfirmedAt:null,lastMutation:'',events:[]});
export function buildDailyAdventure(reading:ReadingProfile,catalog:ReadingCatalog,mode:RunMode,day:string,id:string,now=new Date()):AdventureRun{
 const ready=readySkills(reading,catalog),due=getSkillsDueForReview(reading,now);
 // The authored map story needs five sounds. Keep the existing sound sequence;
 // include at most one due sound review and gentle repeat teaching when needed.
 const warmup=catalog.settings.sequence.filter(l=>['m','s','a','t','p'].includes(l)&&(!ready.has('sound_'+l)||due.includes('sound_'+l))).flatMap(l=>{const m=reading.mastery['sound_'+l];return m?.attempts&&m.score<.18?[l,l]:[l];});
 const words=getDecodableWords(reading,catalog).filter(w=>['mat','map','sat'].includes(w.id));
 const word=words.find(w=>!reading.recentWords.includes(w.id))?.id??'mat';
 return {id,mode,day,steps:mode==='daily'?['episode','blend','collector','story','reward','treehouse','offline']:mode==='episode'?['episode']:['collector'],index:0,warmup,warmupIndex:0,scene:0,time:0,cueDone:[],round:0,page:0,misses:0,help:0,word,startedAt:now.toISOString(),completedAt:null};
}
export function collectorRound(run:AdventureRun):CollectorRound{
 const targets=['map','mat','sat'],target=targets[run.round%targets.length],choices=['map','mat','sat','pat'];
 const offset=(run.round+1)%choices.length,rotated=choices.slice(offset).concat(choices.slice(0,offset));
 return {id:`collector-${run.round}`,kind:'words',instruction:'Listen, then collect the word. Take your time.',audioText:`Collect the word ${target}. ${target}.`,target,choices:rotated.map(id=>({id,label:id})),skillId:'blend_cvc'};
}
export function advanceExperience(run:AdventureRun,now=new Date()){run.index++;run.misses=0;run.help=0;run.time=0;if(run.index>=run.steps.length)run.completedAt=now.toISOString();}
export function experienceAttempt(childId:string,run:AdventureRun,skillId:string,target:string,response:string,correct:boolean,supported:boolean,now=new Date()):ReadingAttempt{
 return {id:crypto.randomUUID(),childId,sessionId:run.id,activityId:`${run.steps[run.index]}-${run.warmupIndex}-${run.scene}-${run.round}-${run.index}`,kind:skillId.startsWith('sound_')?'letter-catch':skillId==='story_detail'?'story':'blend-train',skillId,stimulus:target,response,correct,helpLevel:run.help,attemptNumber:run.misses+1,responseTimeMs:0,errorType:correct?null:'experience_response',evidence:skillId==='story_detail'?'comprehension':supported||run.help>0?'supported-practice':'independent-choice',createdAt:now.toISOString()};
}
