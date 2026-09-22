import {withFamily} from '@/lib/backend/context';
import {readExplorer} from '@/lib/backend/repository';
import {familyAuthorized,parentAuthorized} from '@/lib/parent-security';
import {requestJson,RequestBodyError} from '@/lib/request-json';
import {normalizeExplorer} from '@/lib/explorers';
import {scheduleMessage} from '@/lib/learning-controls';
import {quizSchema,artSchema,publicAssignment,type Quiz,type Assignment,type Artwork} from '@/lib/workspace-content';
import {createItem,itemById,itemsFor,updateItem,deleteItem} from '@/lib/workspace-store';
import {parentActivityDraft} from '@/lib/parent-activity-draft';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function get(request:Request){
  try{
    if(!await familyAuthorized(request))return reply({error:'Open your family workspace first.'},403);
    const url=new URL(request.url),profile=url.searchParams.get('profile')??'',kind=url.searchParams.get('kind');
    if(kind==='sets'){
      if(!await parentAuthorized(request))return reply({error:'Unlock Parent Corner.'},403);
      return reply({items:await itemsFor<Quiz>('family','set')});
    }
    if(!await readExplorer(profile))return reply({error:'Choose an explorer.'},404);
    if(kind==='assignments')return reply({items:(await itemsFor<Assignment>(profile,'assignment')).map(publicAssignment)});
    if(kind==='art'){const page=Number(url.searchParams.get('page')??0);if(!Number.isInteger(page)||page<0||page>8)return reply({error:'Choose a gallery page.'},400);return reply({items:await itemsFor<Artwork>(profile,'art',12,page*12)});}
    if(kind==='observations')return reply({items:await itemsFor(profile,'observation')});
    if(kind==='prayers'){
      const row=await readExplorer(profile);
      if(!row||!normalizeExplorer(JSON.parse(row.data)).controls.faith)return reply({error:'Faith & Bible is not enabled.'},403);
      return reply({items:await itemsFor(profile,'prayer')});
    }
    return reply({error:'Choose a collection.'},400);
  }catch{return reply({error:'Your collection could not be opened. Try again.'},503);}
}
async function post(request:Request){
  try{
    if(!await familyAuthorized(request))return reply({error:'Open your family workspace first.'},403);
    if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
    const input=await requestJson(request,450000),action=input.action;
    const parent=['save-set','delete-item','assign','replay-assignment','draft-set'].includes(String(action));
    if(parent&&!await parentAuthorized(request))return reply({error:'Unlock Parent Corner first.'},403);
    if(action==='save-set'){
      const parsed=quizSchema.safeParse(input.data);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
      if(input.id){const existing=await itemById<Quiz>(String(input.id));if(!existing||existing.kind!=='set')return reply({error:'Activity set not found.'},404);if(existing.revision!==input.revision)return reply({error:'This set changed. Reopen it before saving.'},409);const updated=await updateItem(existing,parsed.data);return updated?reply({item:updated}):reply({error:'This set changed. Reopen it.'},409);}
      if((await itemsFor('family','set')).length>=100)return reply({error:'Your library has 100 sets. Remove an unused set first.'},409);
      return reply({item:await createItem('family','set',parsed.data)},201);
    }
    if(action==='delete-item'){
      if(input.confirm!==true)return reply({error:'Confirm this deletion.'},400);
      const existing=await itemById(String(input.id));if(!existing)return reply({error:'Item not found.'},404);
      if(existing.revision!==input.revision)return reply({error:'This item changed. Reload it first.'},409);
      return await deleteItem(existing.id,existing.revision)?reply({deleted:true}):reply({error:'This item changed. Reload it first.'},409);
    }
    const row=await readExplorer(String(input.profile??''));
    if(!row)return reply({error:'Choose an explorer.'},404);
    const profile=normalizeExplorer(JSON.parse(row.data));
    if(action==='draft-set'){
      if(!['reading','math','logic'].includes(String(input.subject))||!Number.isInteger(input.level)||Number(input.level)<1||Number(input.level)>3||!Number.isInteger(input.count)||Number(input.count)<1||Number(input.count)>20)return reply({error:'Choose a subject, level, and 1–20 questions.'},400);
      return reply({draft:parentActivityDraft(profile.grade,input.subject as 'reading'|'math'|'logic',Number(input.level),Number(input.count))});
    }
    if(!parent&&(profile.preferences.paused||scheduleMessage(profile.controls)))return reply({error:scheduleMessage(profile.controls)??'A grown-up can resume adventures in Parent Corner.'},403);
    if(action==='assign'){
      const set=await itemById<Quiz>(String(input.setId));if(!set||set.kind!=='set')return reply({error:'Choose a saved activity set.'},404);
      if(input.due!==null&&(typeof input.due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.due)))return reply({error:'Choose a due date or no date.'},400);
      if((await itemsFor(profile.id,'assignment')).length>=100)return reply({error:'Remove an older assignment before adding another.'},409);
      const assigned=await createItem(profile.id,'assignment',{...set.data,index:0,correct:0,misses:0,sourceId:set.id,due:input.due,badge:input.badge===true} satisfies Assignment);
      return reply({item:publicAssignment(assigned)},201);
    }
    if(action==='answer-assignment'||action==='replay-assignment'){
      const item=await itemById<Assignment>(String(input.id));if(!item||item.kind!=='assignment'||item.profileId!==profile.id)return reply({error:'Assignment not found for this explorer.'},404);
      if(item.revision!==input.revision)return reply({error:'Your place changed in another window. Reopen the challenge.'},409);
      const data={...item.data};let feedback='';let correct=false;
      if(action==='replay-assignment'){if(input.confirm!==true)return reply({error:'Confirm restarting this assignment.'},400);data.index=0;data.correct=0;data.misses=0;delete data.completedAt;}
      else{
        const q=data.questions[data.index];if(!q)return reply({error:'This challenge is complete.'},409);
        if(typeof input.answer!=='string'||input.answer.length>100)return reply({error:'Choose or write an answer.'},400);
        correct=input.answer.trim().toLocaleLowerCase()===q.answer.trim().toLocaleLowerCase();
        if(correct){data.correct++;data.index++;feedback=q.explanation||'You thought it through!';if(data.index===data.questions.length)data.completedAt=new Date().toISOString();}
        else{data.misses++;feedback=q.hint||'Try another idea. You can ask your grown-up for help.';}
      }
      const saved=await updateItem(item,data);return saved?reply({item:publicAssignment({...saved,data}),feedback,correct}):reply({error:'Your place changed. Reopen the challenge.'},409);
    }
    if(action==='save-prayer'){
      if(!profile.controls.faith)return reply({error:'Faith & Bible is not enabled.'},403);
      if(typeof input.text!=='string'||!input.text.trim()||input.text.length>1200)return reply({error:'Write a prayer of up to 1200 characters.'},400);
      return reply({item:await createItem(profile.id,'prayer',{text:input.text.trim()})},201);
    }
    if(action==='save-art'){
      const result=artSchema.safeParse(input.data);if(!result.success)return reply({error:'Check the artwork title, tools, and canvas size.'},400);
      if(input.id){const existing=await itemById<Artwork>(String(input.id));if(!existing||existing.profileId!==profile.id||existing.kind!=='art')return reply({error:'Artwork not found.'},404);if(existing.revision!==input.revision)return reply({error:'This artwork changed in another window. Save a new copy to keep your work.'},409);const updated=await updateItem(existing,result.data);return updated?reply({item:updated}):reply({error:'Artwork changed. Save a new copy.'},409);}
      if((await itemsFor(profile.id,'art')).length>=100)return reply({error:'Your gallery is full. Ask a grown-up to manage it in Parent Corner.'},409);
      return reply({item:await createItem(profile.id,'art',result.data)},201);
    }
    return reply({error:'Choose an action.'},400);
  }catch(error){if(error instanceof RequestBodyError)return reply({error:error.message},error.status);console.error(error);return reply({error:'Your changes could not be saved. Please try again.'},503);}
}

export const GET = withFamily(get);
export const POST = withFamily(post);
