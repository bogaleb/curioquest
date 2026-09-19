import {withFamily} from '@/lib/backend/context';
import {readExplorer,commit,catalog} from '@/lib/backend/repository';
import {familyAuthorized} from '@/lib/parent-security';
import {normalizeExplorer} from '@/lib/explorers';
import type {stories as storyDefinitions,prayers as prayerDefinitions} from '@/lib/story-library';
import {itemsFor} from '@/lib/workspace-store';
import {scheduleMessage} from '@/lib/learning-controls';
import {requestJson,RequestBodyError} from '@/lib/request-json';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function profileFor(request:Request,id:string){if(!await familyAuthorized(request))return null;const row=await readExplorer(id);return row?normalizeExplorer(JSON.parse(row.data)):null;}
async function get(request:Request){try{const {stories,prayers}=await catalog<{stories:typeof storyDefinitions;prayers:typeof prayerDefinitions}>("stories");const url=new URL(request.url),profile=await profileFor(request,url.searchParams.get('profile')??'');if(!profile)return reply({error:'Choose your explorer.'},403);const progress=await itemsFor<{storyId:string;scene:number;completedAt:string|null}>(profile.id,'story');return reply({stories:stories.filter(s=>s.category!=='faith'||profile.controls.faith),prayers:profile.controls.faith?prayers:[],progress:progress.map(r=>r.data).filter(p=>stories.some(s=>s.id===p.storyId&&(s.category!=='faith'||profile.controls.faith)))});}catch{return reply({error:'The bookshelf could not be opened.'},503);}}
async function post(request:Request){try{const {stories}=await catalog<{stories:typeof storyDefinitions}>("stories");
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
  const body=await requestJson(request,4000),profile=await profileFor(request,String(body.profile??''));if(!profile)return reply({error:'Choose your explorer.'},403);
  if(profile.preferences.paused||scheduleMessage(profile.controls))return reply({error:scheduleMessage(profile.controls)??'Adventures are paused.'},403);
  const story=stories.find(s=>s.id===body.story);if(!story||(story.category==='faith'&&!profile.controls.faith))return reply({error:'This story is not available for this explorer.'},403);
  if(!Number.isInteger(body.scene)||Number(body.scene)<0||Number(body.scene)>story.scenes.length)return reply({error:'Choose a page in this story.'},400);
  const data={storyId:story.id,scene:Number(body.scene),completedAt:body.scene===story.scenes.length?new Date().toISOString():null};
  if(!await commit<boolean>('save-story',{childId:profile.id,storyId:story.id,data}))return reply({error:'This explorer is no longer available.'},404);
  return reply({progress:data});
}catch(e){if(e instanceof RequestBodyError)return reply({error:e.message},e.status);return reply({error:'Your page could not be saved. Try again.'},503);}}

export const GET = withFamily(get);
export const POST = withFamily(post);
