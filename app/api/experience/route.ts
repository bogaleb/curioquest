import {withFamily} from '@/lib/backend/context';
import {readExplorer} from '@/lib/backend/repository';
import {familyAuthorized,parentAuthorized} from '@/lib/parent-security';
import {normalizeExplorer} from '@/lib/explorers';
import {scheduleMessage} from '@/lib/learning-controls';
import {requestJson,RequestBodyError} from '@/lib/request-json';
import {readingCatalog,readingProfile} from '@/lib/reading/store';
import {updateReadingMastery,getDecodableWords,getDecodableStories,letterActivity} from '@/lib/reading/engine';
import {experienceCatalog,experienceProfile,saveExperience,worldInventory} from '@/lib/experience/store';
import {buildDailyAdventure,collectorRound,advanceExperience,experienceAttempt} from '@/lib/experience/engine';
import type {ExperienceView,RunMode} from '@/lib/experience/types';
import type {ReadingAttempt} from '@/lib/reading/types';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const validMode=(s:unknown):RunMode=>s==='episode'?'episode':s==='game'?'game':'daily';
async function context(id:string){
 const row=await readExplorer(id);if(!row)return null;
 const [catalog,state,reading,content,world]=await Promise.all([readingCatalog(),experienceProfile(id),readingProfile(id),experienceCatalog(),worldInventory(id)]);
 return state&&reading?{child:normalizeExplorer(JSON.parse(row.data)),catalog,...state,reading,content,...world}:null;
}
type Context=NonNullable<Awaited<ReturnType<typeof context>>>;
function publicView(c:Context,mode:RunMode):ExperienceView{
 const {lastMutation,...state}=c.state;void lastMutation;
 const run=c.state.runs[mode]??null,step=run&&!run.completedAt?run.steps[run.index]:null;
 const letter=run?.warmup[run.warmupIndex],warmup=letter?letterActivity(letter,run!.warmupIndex,'practice',c.catalog,true):null;
 const skill=c.catalog.skills.find(s=>s.letter===letter);
 const currentCue=run&&step==='episode'&&!warmup?c.content.cues.find(q=>q.scene===run!.scene&&run!.time>=q.at&&!run!.cueDone.includes(q.id)):null;
 const cue=currentCue?(({answer,...safe})=>{void answer;return safe;})(currentCue):null;
 const word=c.catalog.words.find(w=>w.id===(currentCue?.kind==='blend'?'map':run?.word))??null;
 const activity=run&&word?{id:run.id+'blend',kind:'blend-train' as const,skillId:'blend_cvc',target:word.id,choices:['map','mat','sat','pat'].filter(id=>getDecodableWords(c.reading.profile,c.catalog).some(w=>w.id===id)),reason:'practice' as const,taught:true}:null;
 const game=run&&step==='collector'?collectorRound(run):null;const collector=game?(({target,...safe})=>{void target;return safe;})(game):null;
 const book=c.catalog.stories.find(s=>s.id==='sam-sat'),story=book?(({answer,...safe})=>{void answer;return safe;})(book):null;
 return {state,revision:c.revision,media:c.content.media,items:c.content.items,inventory:c.inventory,placements:c.placements,run,step,warmup,letter:skill?{letter:skill.letter!,phoneme:skill.phoneme!,example:skill.example!,cue:skill.cue!}:null,cue,word,activity,collector,story,stars:c.child.stars};
}
async function get(request:Request){try{if(!await familyAuthorized(request))return reply({error:'Open your family workspace first.'},403);const url=new URL(request.url),c=await context(url.searchParams.get('profile')??'');return c?reply(publicView(c,validMode(url.searchParams.get('mode')))):reply({error:'Choose an explorer.'},404);}catch{return reply({error:'Your adventure could not be opened. Please try again.'},503);}}
async function post(request:Request){try{
 if(!await familyAuthorized(request))return reply({error:'Open your family workspace first.'},403);
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
 const input=await requestJson(request,6000),c=await context(String(input.profile??''));if(!c)return reply({error:'Choose an explorer.'},404);
 const action=String(input.action),mode=validMode(input.mode),now=new Date(),at=now.toISOString();
 if(action==='confirm-offline'){if(!await parentAuthorized(request))return reply({error:'Unlock Parent Corner first.'},403);}else if(c.child.preferences.paused||scheduleMessage(c.child.controls))return reply({error:scheduleMessage(c.child.controls)??'Your adventure is resting. A grown-up can resume it.'},403);
 if(input.revision!==c.revision)return reply({error:'Your adventure changed in another window. Refresh your saved place.'},409);
 let attempt:ReadingAttempt|null=null,feedback='',correct:boolean|undefined,placement:{slot:string;item:string|null}|undefined;const rewards:string[]=[];
 const earn=(id:string)=>{if(!c.inventory.some(x=>x.item_id===id)&&!rewards.includes(id)){rewards.push(id);c.state.events.push({type:'world_item_unlocked',at,content:id});}};
 let run=c.state.runs[mode];
 if(action==='start'){
  if(!run||run.completedAt){const day=new Intl.DateTimeFormat('en-CA',{timeZone:c.child.controls.timeZone}).format(now);run=buildDailyAdventure(c.reading.profile,c.catalog,mode,day,crypto.randomUUID(),now);c.state.runs[mode]=run;c.state.events.push({type:'adventure_started',at,content:mode});}
 }else if(action==='favorite'){
  const id=String(input.media);if(!c.content.media.some(m=>m.id===id&&m.active))return reply({error:'Choose an available episode.'},400);
  c.state.favoriteMedia=c.state.favoriteMedia.includes(id)?c.state.favoriteMedia.filter(x=>x!==id):[...c.state.favoriteMedia,id];
 }else if(action==='place'){
  const slot=String(input.slot),item=input.item===null?null:String(input.item);
  if(!['wall','shelf','desk'].includes(slot)||item!==null&&!c.inventory.some(x=>x.item_id===item))return reply({error:'Choose an earned item and a treehouse spot.'},400);
  placement={slot,item};c.state.events.push({type:'world_item_placed',at,content:item??'removed'});
  const daily=c.state.runs.daily;if(item==='explorer-map'&&daily?.steps[daily.index]==='treehouse'){
   advanceExperience(daily,now);earn('moon-lamp');earn('star-globe');c.state.events.push({type:'adventure_completed',at,content:'daily'});
   if(!c.child.controls.offline){daily.index=daily.steps.length;daily.completedAt=at;}
  }
  feedback=item?'Your discovery has a home.':'Your item is safe in your inventory.';
 }else if(action==='confirm-offline'){
  if(!c.state.offlineRequestedAt)return reply({error:'There is no mission waiting for confirmation.'},409);c.state.offlineConfirmedAt=at;earn('discovery-plant');feedback='Real-world discovery confirmed.';
 }else{
  if(!run||run.completedAt||input.run!==run.id)return reply({error:'Open your saved adventure first.'},409);
  const step=run.steps[run.index],letter=run.warmup[run.warmupIndex];
  const cue=c.content.cues.find(q=>q.scene===run!.scene&&run!.time>=q.at&&!run!.cueDone.includes(q.id));
  if(action==='help'){run.help=Math.min(4,run.help+1);c.state.events.push({type:'nova_hint_used',at,content:step});feedback=letter?`Try the first sound in ${c.catalog.skills.find(s=>s.letter===letter)?.example}.`:cue?.help??(step==='collector'?`Listen and look together: ${collectorRound(run).target}.`:'Say every sound with your grown-up.');}
  else if(action==='tick'){
   if(step!=='episode'||letter)return reply({error:'Finish the sound practice first.'},409);
   const scene=c.content.media.find(m=>m.id==='missing-map')!.scenes[run.scene];const next=c.content.cues.find(q=>q.scene===run!.scene&&!run!.cueDone.includes(q.id));
   if(typeof input.time!=='number'||!Number.isFinite(input.time)||input.time<0)return reply({error:'Choose a valid playback position.'},400);
   run.time=Math.max(run.time,Math.min(input.time,next?.at??scene.duration));
  }else if(action==='next-scene'){
   const media=c.content.media.find(m=>m.id==='missing-map')!;
   if(step!=='episode'||letter||cue||run.time<media.scenes[run.scene].duration)return reply({error:'Explore the current scene and its activity first.'},409);
   if(run.scene===media.scenes.length-1){c.state.watched=[...new Set([...c.state.watched,media.id])];earn('explorer-map');advanceExperience(run,now);c.state.events.push({type:'video_completed',at,content:media.id});}
   else {run.scene++;run.time=0;run.help=0;run.misses=0;}
  }else if(action==='story-page'){
   if(step!=='story'||!getDecodableStories(c.reading.profile,c.catalog).some(s=>s.id==='sam-sat'))return reply({error:'Practice your sounds in Reading Adventure first, then return here.'},409);
   run.page=Math.min(2,run.page+1);
  }else if(action==='claim'){
   if(step!=='reward')return reply({error:'Finish the learning discoveries first.'},409);earn('explorer-map');advanceExperience(run,now);
  }else if(action==='offline'){
   if(step!=='offline'||!c.child.controls.offline)return reply({error:'Choose the current adventure step.'},409);c.state.offlineRequestedAt=at;advanceExperience(run,now);feedback='Tell your grown-up what you found. They can confirm it in Parent Corner.';
  }else if(action==='answer'){
   if(typeof input.response!=='string'||input.response.length>80)return reply({error:'Choose an answer.'},400);
   const response=input.response;let target='',skill='',supported=true,choices:string[]=[];
   if(letter){target=letter;skill='sound_'+letter;choices=letterActivity(letter,run.warmupIndex,'practice',c.catalog,true).choices;}
   else if(step==='episode'&&cue){target=cue.answer;skill=cue.skillId;choices=cue.kind==='sequence'?[cue.answer,...['amp','pam','pma','apm','mpa']]:cue.choices;}
   else if(step==='blend'){const word=getDecodableWords(c.reading.profile,c.catalog).find(w=>w.id===run!.word);if(!word)return reply({error:'Explore these sounds in Reading Adventure, then return.'},409);target=word.id;skill='blend_cvc';choices=publicView(c,mode).activity!.choices;}
   else if(step==='collector'){const game=collectorRound(run);if(!getDecodableWords(c.reading.profile,c.catalog).some(w=>w.id===game.target))return reply({error:'Practice these sounds in Reading Adventure first.'},409);target=game.target;skill=game.skillId;choices=game.choices.map(x=>x.id);supported=false;}
   else if(step==='story'){const story=getDecodableStories(c.reading.profile,c.catalog).find(s=>s.id==='sam-sat');if(!story||run.page<story.pages.length)return reply({error:'Read the tiny pages together first.'},409);target=story.answer;skill='story_detail';choices=story.choices;}
   else return reply({error:'Explore the current scene first.'},409);
   if(!choices.includes(response))return reply({error:'Choose from this activity’s answers.'},400);
   correct=response.toLowerCase()===target.toLowerCase();attempt=experienceAttempt(c.child.id,run,skill,target,response,correct,supported,now);updateReadingMastery(c.reading.profile,attempt,c.catalog);
   c.state.events.push({type:'learning_attempt',at,content:step});
   if(correct){feedback=letter?'You connected a sound and its letter!':step==='collector'?'Careful listening. A discovery collected!':'You connected the sounds. A new part of the adventure is ready.';
    if(letter){run.warmupIndex++;if((c.reading.profile.mastery['sound_'+letter]?.score??0)<c.catalog.settings.readyScore&&run.warmup.length<15)run.warmup.push(letter);if(!c.reading.profile.introduced.includes(letter))c.reading.profile.introduced.push(letter);}
    else if(step==='episode')run.cueDone.push(cue!.id);
    else if(step==='collector'){run.round++;if(run.round===3){c.state.gameCompletions++;earn('robot-toy');advanceExperience(run,now);}}
    else {if(step==='story'){earn('nova-storybook');c.reading.profile.books=[...new Set([...c.reading.profile.books,'sam-sat'])];}advanceExperience(run,now);}
    run.misses=0;run.help=0;
   }else {run.misses++;feedback='A useful clue! Listen again and look at each sound. Nova will help.';}
  }else return reply({error:'Choose an adventure action.'},400);
 }
 c.state.events=c.state.events.slice(-120);
 if(!await saveExperience(c.child.id,c.state,c.revision,c.reading.profile,c.reading.revision,attempt,rewards,placement))return reply({error:'Your learning changed in another window. Refresh your saved place.'},409);
 const updated=await context(c.child.id);return reply({...publicView(updated!,mode),feedback,correct});
 }catch(e){if(e instanceof RequestBodyError)return reply({error:e.message},e.status);console.error('Experience save failed',e);return reply({error:'Your discovery could not be saved. Keep this page open and try again.'},503);}}

export const GET = withFamily(get);
export const POST = withFamily(post);
