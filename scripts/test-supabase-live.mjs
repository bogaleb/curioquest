import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {loadTs} from '../tests/load-typescript.mjs';
import {solveRoute} from '../tests/solve-route.mjs';

// Uses only temporary accounts created by this run. Never selects existing families.
try {process.loadEnvFile('.env.local');} catch(error) {if(error.code!=='ENOENT')throw error;}
const base=process.env.CURIOQUEST_TEST_URL??'http://localhost:5173';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY;
assert.ok(key?.startsWith('sb_secret_'),'Configure the server-only key first.');
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const authOnly=process.argv.includes('--auth-only');
const users=[];
const mediaPaths=[];
function browser(){
 const jar=new Map();
 return async(path,body,expected=200,method=body?'POST':'GET')=>{
  const headers={Origin:base,Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')};
  if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';
  const response=await fetch(base+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(30000)});
  for(const item of response.headers.getSetCookie()){
   const pair=item.split(';')[0],i=pair.indexOf('=');
   if(i>0){const name=pair.slice(0,i),value=pair.slice(i+1);if(value)jar.set(name,value);else jar.delete(name);}
  }
  assert.equal(response.status,expected,method+' '+path+' returned '+response.status);
  return response;
 };
}
async function makeUser(){
 const email='cq-verification-'+randomUUID()+'@example.com',password=randomUUID()+'aA!9';
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Temporary integration test'}});
 assert.ok(!error&&data.user,'Could not create temporary verification account.');
 users.push(data.user.id);
 return {email,password,id:data.user.id};
}
try {
 const guest=browser();
 for(const path of ['/auth/sign-in','/auth/sign-up','/auth/recover']){
  const response=await guest(path);assert.match(await response.text(),/CurioQuest/);
 }
 for(const path of ['/','/account/children','/account/media'])await guest(path,undefined,307);
 for(const path of ['/api/quest','/api/reading','/api/experience','/api/parent','/api/parent/export','/api/workspace','/api/stories','/api/media'])await guest(path,undefined,401);
 const csrf=await fetch(base+'/auth/session',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:JSON.stringify({action:'sign-in'})});assert.equal(csrf.status,403);
 if(!authOnly){const health=await guest('/api/supabase/health');assert.equal((await health.json()).databaseVersion,'202609200003');}
 const a=await makeUser(),first=browser();
 await first('/auth/session',{action:'sign-in',email:a.email,password:a.password});
 assert.match(await(await first('/')).text(),/CurioQuest/);
 if(!authOnly){
  await first('/account/children');
  assert.deepEqual((await(await first('/api/quest')).json()).profiles,[]);
  await first('/api/parent',{action:'setup',pin:'482619'});
  await first('/api/quest',{action:'create-profile',name:'Test explorer',grade:'prek',avatar:'fox',interests:['animals'],dailyGoal:10},201);
  const child=(await(await first('/api/quest')).json()).profiles[0];assert.ok(child.id);
  await first('/api/quest',{action:'start',profile:child.id,subject:'daily'});
  const persisted=(await(await first('/api/quest')).json()).profiles[0];assert.ok(persisted.session?.id);
  const {questions}=loadTs('lib/curriculum');
  let progress=persisted,lastAnswer,answered=0;
  while(progress.session?.question){
   assert.ok(answered<30,'Quest did not complete within its expected bound.');
   const question=progress.session.question;
   assert.equal(question.answer,undefined);assert.equal(question.engine?.solution,undefined);
   const authored=questions.find(item=>item.id===question.id);assert.ok(authored,'Question missing from authored catalog.');
   let answer=authored.answer;
   if(['sorting','matching','ordering'].includes(authored.engine?.kind))answer=JSON.stringify(authored.engine.solution);
   if(authored.engine?.kind==='route')answer=JSON.stringify(solveRoute(authored.engine));
   if(authored.engine?.kind==='memory')answer=JSON.stringify(authored.engine.sequence);
   lastAnswer={action:'answer',profile:child.id,session:progress.session.id,question:question.id,answer};
   progress=(await(await first('/api/quest',lastAnswer)).json()).profile;answered++;
  }
  assert.ok(answered>0);assert.ok(progress.stars>persisted.stars,'Completed quest did not award stars.');
  await first('/api/quest',lastAnswer,409);
  const reloaded=(await(await first('/api/quest')).json()).profiles[0];assert.equal(reloaded.stars,progress.stars);
  const attempts=await admin.from('activity_attempts').select('id,correct').eq('child_id',child.id);
  assert.equal(attempts.error,null);assert.equal(attempts.data.length,answered);assert.ok(attempts.data.every(item=>item.correct));
  const ledger=await admin.from('reward_events').select('amount').eq('child_id',child.id);
  assert.equal(ledger.error,null);assert.equal(ledger.data.reduce((sum,item)=>sum+item.amount,0),progress.stars);
  const exported=await(await first('/api/parent/export')).json();assert.equal(exported.profiles[0].stars,progress.stars);
  const b=await makeUser(),second=browser();
  await second('/auth/session',{action:'sign-in',email:b.email,password:b.password});
  assert.deepEqual((await(await second('/api/quest')).json()).profiles,[]);
  await second('/api/quest',{action:'start',profile:child.id,subject:'daily'},404);
  const direct=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  assert.equal((await direct.auth.signInWithPassword({email:b.email,password:b.password})).error,null);
  const foreign=await direct.from('child_profiles').select('id').eq('id',child.id);assert.equal(foreign.error,null);assert.deepEqual(foreign.data,[]);
  assert.ok((await direct.rpc('cq_read',{p_parent:a.id,p_kind:'explorers'})).error,'Browser role must not call privileged RPCs');
  const form=new FormData();form.set('title','Verification captions');form.set('slug','verification-captions');form.set('file',new Blob(['WEBVTT\n\n00:00.000 --> 00:01.000\nHello\n'],{type:'text/vtt'}),'captions.vtt');
  await first('/api/media',form,201);
  const item=(await(await first('/api/media')).json()).items[0];assert.ok(item.url);mediaPaths.push(item.object_path);
  assert.equal((await fetch(item.url)).status,200);
  const denied=await direct.storage.from('family-media').download(item.object_path);assert.ok(denied.error);
  await second('/api/parent',{action:'setup',pin:'618294'});
  assert.deepEqual((await(await second('/api/media')).json()).items,[]);
  await second('/api/media',{id:item.id,confirm:true},404,'DELETE');
  await first('/api/media',{id:item.id,confirm:true},200,'DELETE');
  await direct.auth.signOut();
 }
 await first('/auth/session',{action:'sign-out'});
 await first('/api/quest',undefined,401);
 await first('/',undefined,307);
 console.log(authOnly?'PASS: native Next.js pages, protected routes, CSRF, hosted Auth sign-in, SSR cookies and sign-out.':'PASS: hosted Auth, completed quest, attempts, repeat-safe stars, export, family RLS, restricted RPCs and private Storage.');
} finally {
 let failed=false;
 if(mediaPaths.length){const {error}=await admin.storage.from('family-media').remove(mediaPaths);if(error){failed=true;console.error('Temporary media cleanup failed.');}}
 for(const id of users){const {error}=await admin.auth.admin.deleteUser(id);if(error){failed=true;console.error('Temporary account cleanup failed for '+id);}}
 if(failed)process.exitCode=1;
}
