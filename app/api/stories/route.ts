import {database} from '@/db/raw';
import {familyAuthorized} from '@/lib/parent-security';
import {normalizeExplorer} from '@/lib/explorers';
import {stories,prayers} from '@/lib/story-library';
import {scheduleMessage} from '@/lib/learning-controls';
import {requestJson,RequestBodyError} from '@/lib/request-json';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function profileFor(request:Request,id:string){if(!await familyAuthorized(request))return null;const row=await database().prepare('SELECT data FROM explorers WHERE id = ?').bind(id).first<{data:string}>();return row?normalizeExplorer(JSON.parse(row.data)):null;}
export async function GET(request:Request){try{const url=new URL(request.url),profile=await profileFor(request,url.searchParams.get('profile')??'');if(!profile)return reply({error:'Choose your explorer.'},403);const progress=await database().prepare("SELECT data FROM workspace_items WHERE profile_id = ? AND kind = 'story'").bind(profile.id).all<{data:string}>();return reply({stories:stories.filter(s=>s.category!=='faith'||profile.controls.faith),prayers:profile.controls.faith?prayers:[],progress:progress.results.map(r=>JSON.parse(r.data)).filter(p=>stories.some(s=>s.id===p.storyId&&(s.category!=='faith'||profile.controls.faith)))});}catch{return reply({error:'The bookshelf could not be opened.'},503);}}
export async function POST(request:Request){try{
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
  const body=await requestJson(request,4000),profile=await profileFor(request,String(body.profile??''));if(!profile)return reply({error:'Choose your explorer.'},403);
  if(profile.preferences.paused||scheduleMessage(profile.controls))return reply({error:scheduleMessage(profile.controls)??'Adventures are paused.'},403);
  const story=stories.find(s=>s.id===body.story);if(!story||(story.category==='faith'&&!profile.controls.faith))return reply({error:'This story is not available for this explorer.'},403);
  if(!Number.isInteger(body.scene)||Number(body.scene)<0||Number(body.scene)>story.scenes.length)return reply({error:'Choose a page in this story.'},400);
  const data={storyId:story.id,scene:Number(body.scene),completedAt:body.scene===story.scenes.length?new Date().toISOString():null};
  const saved=await database().prepare("INSERT INTO workspace_items (id,profile_id,kind,data,revision,updated_at) SELECT ?,?,'story',?,0,? WHERE EXISTS (SELECT 1 FROM explorers WHERE id = ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, revision = workspace_items.revision + 1, updated_at = excluded.updated_at").bind(`story:${profile.id}:${story.id}`,profile.id,JSON.stringify(data),new Date().toISOString(),profile.id).run();
  if(!saved.meta.changes)return reply({error:'This explorer is no longer available.'},404);
  return reply({progress:data});
}catch(e){if(e instanceof RequestBodyError)return reply({error:e.message},e.status);return reply({error:'Your page could not be saved. Try again.'},503);}}
