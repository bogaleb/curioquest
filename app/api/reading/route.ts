import {database} from '@/db/raw';
import {familyAuthorized,parentAuthorized} from '@/lib/parent-security';
import {normalizeExplorer} from '@/lib/explorers';
import {scheduleMessage} from '@/lib/learning-controls';
import {requestJson,RequestBodyError} from '@/lib/request-json';
import {readingCatalog,readingProfile,saveReading} from '@/lib/reading/store';
import {buildReadingSession,advanceReadingSession,updateReadingMastery,classifyReadingError,getDecodableWords,newReadingProfile} from '@/lib/reading/engine';
import type {ReadingAttempt,ReadingCatalog,ReadingProfile,ReadingView} from '@/lib/reading/types';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function view(profile:ReadingProfile,revision:number,catalog:ReadingCatalog,stars:number):ReadingView{
  const {session,lastMutation,...safe}=profile;void lastMutation;
  const stories=catalog.stories.map(({answer,...story})=>{void answer;return story;});
  return {profile:safe,revision,session:session?{...session,activities:undefined,total:session.activities.length,activity:session.activities[session.index]??null} as ReadingView['session']:null,catalog:{...catalog,stories},readyWords:getDecodableWords(profile,catalog),stars};
}
async function explorer(id:string){const row=await database().prepare('SELECT data FROM explorers WHERE id=?').bind(id).first<{data:string}>();return row?normalizeExplorer(JSON.parse(row.data)):null;}
export async function GET(request:Request){try{if(!await familyAuthorized(request))return reply({error:'Open your family workspace first.'},403);const child=await explorer(new URL(request.url).searchParams.get('profile')??'');if(!child)return reply({error:'Choose an explorer.'},404);const [catalog,state]=await Promise.all([readingCatalog(),readingProfile(child.id)]);if(!state)return reply({error:'Explorer not found.'},404);return reply(view(state.profile,state.revision,catalog,child.stars));}catch{return reply({error:'Your reading map could not be opened. Please try again.'},503);}}
export async function POST(request:Request){try{
  if(!await familyAuthorized(request))return reply({error:'Open your family workspace first.'},403);
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
  const input=await requestJson(request,8000),child=await explorer(String(input.profile??''));if(!child)return reply({error:'Choose an explorer.'},404);
  const reset=input.action==='reset';if(reset){if(!await parentAuthorized(request))return reply({error:'Unlock Parent Corner first.'},403);if(input.confirm!==child.name)return reply({error:'Type the explorer name to confirm.'},400);}else if(child.preferences.paused||scheduleMessage(child.controls))return reply({error:scheduleMessage(child.controls)??'Reading adventures are taking a little rest.'},403);
  const [catalog,state]=await Promise.all([readingCatalog(),readingProfile(child.id)]);if(!state)return reply({error:'Choose an explorer.'},404);
  if(input.revision!==state.revision)return reply({error:'Your reading place changed in another window. Refresh your saved place.'},409);
  let profile=state.profile;const now=new Date(),at=now.toISOString();let attempt:ReadingAttempt|null=null,feedback='',correct:boolean|undefined,stars=0;
  if(reset){profile=newReadingProfile();feedback='A fresh reading map is ready. Earlier attempts stay in the family export.';}
  else if(input.action==='start'){
    if(!profile.session||profile.session.completedAt){profile.session=buildReadingSession(profile,catalog,crypto.randomUUID(),now);profile.events.push({type:'reading_session_started',at});}
  }else{
    const session=profile.session,activity=session?.activities[session.index];
    if(!session||session.completedAt||!activity||input.session!==session.id||input.activity!==activity.id)return reply({error:'This reading activity has changed. Refresh your saved place.'},409);
    if(input.action==='help'){
      session.helpLevel=Math.min(4,session.helpLevel+1);profile.events.push({type:'reading_hint_used',at,skillId:activity.skillId});feedback=['','Look closely at each letter.','Listen to the sounds with your grown-up.','Let’s put the sounds together.','Listen to the whole word, then try together.'][session.helpLevel];
    }else if(input.action==='teach'){
      if(activity.kind!=='letter-catch'||!activity.taught)return reply({error:'Choose the current letter lesson.'},400);
      if(!profile.introduced.includes(activity.target))profile.introduced.push(activity.target);
      feedback='Now listen and find its letter.';
    }else if(input.action==='story-page'){
      if(activity.kind!=='story')return reply({error:'Open your current story.'},400);const story=catalog.stories.find(s=>s.id===activity.target)!;
      session.storyPage=Math.min(story.pages.length,session.storyPage+1);profile.events.push({type:session.storyPage===1?'reading_story_opened':'reading_story_page',at,skillId:activity.skillId});
    }else if(input.action==='answer'||input.action==='skip'){
      if(input.action==='answer'&&(typeof input.response!=='string'||input.response.length>100))return reply({error:'Choose or build your answer.'},400);
      if(activity.taught&&!profile.introduced.includes(activity.target))return reply({error:'Explore this letter with Nova first.'},409);
      const response=input.action==='skip'?'':String(input.response).trim();let target=activity.target;
      if(activity.kind==='story'){const story=catalog.stories.find(s=>s.id===activity.target)!;if(input.action==='answer'&&session.storyPage<story.pages.length)return reply({error:'Read each tiny page together first.'},409);target=story.answer;}
      if(input.action==='answer'&&activity.kind!=='sound-boxes'&&!activity.choices.includes(response))return reply({error:'Choose one of the answers on this activity.'},400);
      if(activity.kind==='sound-boxes'&&input.action==='answer'){const remaining=[...activity.choices];for(const letter of response){const i=remaining.indexOf(letter);if(i<0)return reply({error:'Use the letter tiles in your tray.'},400);remaining.splice(i,1);}}
      correct=response.toLowerCase()===target.toLowerCase();
      const supported=activity.taught||activity.kind==='blend-train'||session.helpLevel>0;
      attempt={id:crypto.randomUUID(),childId:child.id,sessionId:session.id,activityId:activity.id,kind:activity.kind,skillId:activity.skillId,stimulus:target,response,correct,helpLevel:session.helpLevel,attemptNumber:session.misses+1,responseTimeMs:Math.min(20*60*1000,Math.max(0,now.getTime()-Date.parse(session.activityStartedAt))),errorType:correct?null:input.action==='skip'?'needed_support':classifyReadingError(target,response,activity.kind),evidence:activity.kind==='story'?'comprehension':supported?'supported-practice':'independent-choice',createdAt:at};
      if(input.action==='answer')updateReadingMastery(profile,attempt,catalog);profile.events.push({type:'reading_attempt',at,skillId:activity.skillId});
      if(correct){feedback=activity.kind==='letter-catch'?'You connected a sound and its letter!':activity.kind==='sound-boxes'?'You built the sounds into a word!':activity.kind==='story'?'You found a detail in the story!':'You joined the sounds. Tell your grown-up the word.';if(activity.kind==='blend-train')profile.recentWords=[...profile.recentWords.filter(w=>w!==activity.target),activity.target].slice(-8);if(activity.kind==='story'){profile.books=[...new Set([...profile.books,activity.target])];profile.events.push({type:'reading_story_completed',at});}}
      else {session.misses++;feedback='Let’s listen and try together. A little help is always welcome.';if(session.kind==='placement')session.placementMisses++;}
      if(correct||session.kind==='placement'||input.action==='skip'){
        profile.events.push({type:'reading_activity_completed',at,skillId:activity.skillId});const complete=advanceReadingSession(profile,catalog,now);
        if(complete){profile.events.push({type:'reading_session_completed',at});if(session.kind==='quest')stars=3;feedback=session.kind==='placement'?'Nova found a gentle place to begin.':'Reading adventure complete. Time to stretch and share a discovery!';}
      }
    }else return reply({error:'Choose a reading action.'},400);
  }
  profile.events=profile.events.slice(-100);
  if(!await saveReading(child.id,profile,state.revision,attempt,stars))return reply({error:'Your reading place changed. Refresh your saved place.'},409);
  const latest=await explorer(child.id);return reply({...view(profile,state.revision+1,catalog,latest?.stars??child.stars),feedback,correct});
}catch(e){if(e instanceof RequestBodyError)return reply({error:e.message},e.status);console.error('Reading operation failed',e);return reply({error:'Your reading place could not be saved. Try again.'},503);}}
