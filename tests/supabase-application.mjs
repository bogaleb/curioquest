import { AsyncLocalStorage } from 'node:async_hooks';
import { loadTs } from './load-typescript.mjs';
import { verifyApplicationFlow } from './application-flow.mjs';
import assert from 'node:assert/strict';

// Exercise the REAL route handlers, repositories, scoring and PostgreSQL RPCs.
// Only Supabase Auth verification and HTTP transport are replaced, never the data model.
export async function verifySupabaseApplication(sql) {
 const originalFetch=globalThis.fetch;
 const originalEnv={...process.env};
 const actor=new AsyncLocalStorage();
 const parent='a0000000-0000-4000-8000-000000000001',other='a0000000-0000-4000-8000-000000000002';
 sql("insert into auth.users(id) values ('"+parent+"'),('"+other+"');");
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';
 process.env.SUPABASE_SECRET_KEY='sb_secret_test_only';
 const auth=loadTs('lib/supabase/server'),originalClient=auth.createClient;
 auth.createClient=async()=>({auth:{getUser:async()=>({data:{user:actor.getStore()?{id:actor.getStore(),email_confirmed_at:'2026-01-01'}:null},error:null})}});
 const routes={};
 for(const name of ['quest','parent','parent/export','workspace','stories','reading','experience'])routes['/api/'+name]=loadTs('app/api/'+name+'/route');
 const quote=v=>v===null||v===undefined?'null':"'"+String(v).replaceAll("'","''")+"'";
 let rpcCalls=0;
 globalThis.fetch=async(input,init={})=>{
  const url=new URL(String(input));
  if(url.hostname==='curioquest.test'){
   const request=new Request(url,{...init});
   const selected=request.headers.get('x-test-actor');
   const identity=selected==='anonymous'?null:selected==='other'?other:parent;
   const route=routes[url.pathname]?.[request.method];
   if(!route)return new Response('Not found',{status:404});
   return actor.run(identity,()=>route(request));
  }
  if(url.hostname==='test.supabase.co'&&url.pathname.startsWith('/rest/v1/rpc/')){
   assert.equal(new Headers(init.headers).get('apikey'),'sb_secret_test_only');
   const body=JSON.parse(init.body),name=url.pathname.split('/').at(-1);rpcCalls++;
   let expression;
   if(name==='cq_read')expression='public.cq_read('+[body.p_parent,body.p_kind,body.p_child,body.p_id,body.p_filter,body.p_limit,body.p_offset].map(quote).join(',')+')';
   else if(name==='cq_commit')expression='public.cq_commit('+[body.p_parent,body.p_kind,JSON.stringify(body.p_data)].map(quote).join(',')+')';
   else if(name==='cq_commit_events')expression='public.cq_commit_events('+[body.p_parent,body.p_kind,JSON.stringify(body.p_data),body.p_child,JSON.stringify(body.p_events)].map(quote).join(',')+')';
   else if(name==='cq_events')expression='public.cq_events('+[body.p_parent,body.p_child,body.p_since,body.p_limit].map(quote).join(',')+')';
   else throw new Error('Unexpected RPC '+name);
   try{return Response.json(JSON.parse(sql('set role service_role; select '+expression+';').trim()||'null'));}
   catch(error){console.error('Database integration failure:',name,body.p_kind,error.message);return Response.json({code:'TEST_SQL',message:'Database test failed'},{status:500});}
  }
  throw new Error('Unexpected network call in isolated test: '+url.origin+url.pathname);
 };
 try {
  await verifyApplicationFlow(sql);
  const {newExplorer}=loadTs('lib/explorers');
  const importedChild='b0000000-0000-4000-8000-000000000001';
  const imported=newExplorer(importedChild,'Imported explorer','prek','fox');imported.stars=12;
  const bundle={profiles:[imported],collections:[{id:'b0000000-0000-4000-8000-000000000002',profile_id:importedChild,kind:'prayer',data:{text:'Legacy record'},revision:0,updated_at:new Date().toISOString()}],childMap:{legacy:importedChild}};
  const importExpression='public.cq_import('+[other,JSON.stringify(bundle),'test-import-hash'].map(quote).join(',')+')';
  const importedResult=JSON.parse(sql('set role service_role; select '+importExpression+';').trim());
  assert.equal(importedResult.imported,1);
  assert.equal(JSON.parse(sql('set role service_role; select '+importExpression+';').trim()).alreadyImported,true);
  assert.equal(sql("select count(*) from private.workspace_items where parent_id='"+other+"';").trim(),'1');
  const discrepancy=sql("select count(*) from private.explorer_state e where (e.data->>'stars')::int<>coalesce((select sum(amount) from public.reward_events r where r.child_id=e.child_id),0);").trim();
  assert.equal(discrepancy,'0','Star ledger does not reconcile');
  console.log('PASS: Supabase route integration, two-family isolation, '+rpcCalls+' real PostgreSQL RPC calls, repeat-safe legacy import, star ledger reconciliation.');
 }finally{
  globalThis.fetch=originalFetch;auth.createClient=originalClient;
  for(const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']) {
   if(originalEnv[key]===undefined)delete process.env[key];else process.env[key]=originalEnv[key];
  }
 }
}

