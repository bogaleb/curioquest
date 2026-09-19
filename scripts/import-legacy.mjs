import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {loadTs} from '../tests/load-typescript.mjs';
try{process.loadEnvFile('.env.local');}catch(e){if(e.code!=='ENOENT')throw e;}
const value=name=>process.argv[process.argv.indexOf(name)+1];
const parent=process.argv.includes('--parent-id')?value('--parent-id'):null;
const file=process.argv.includes('--file')?value('--file'):null;
if(!parent||!file)throw Error('Usage: pnpm supabase:import -- --parent-id VERIFIED_PARENT_UUID --file PATH_TO_LEGACY_EXPORT.json');
const {getSupabaseConfig}=loadTs('lib/supabase/config'),{normalizeExplorer}=loadTs('lib/explorers');
const {url}=getSupabaseConfig(),key=process.env.SUPABASE_SECRET_KEY;
if(!key?.startsWith('sb_secret_'))throw Error('Configure the server-only key in .env.local.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:account,error:accountError}=await client.auth.admin.getUserById(parent);
if(accountError||!account.user?.email_confirmed_at)throw Error('Choose an existing, email-confirmed parent account.');
const raw=readFileSync(file,'utf8'),source=JSON.parse(raw);
if(source.schemaVersion!==4||!Array.isArray(source.profiles)||source.profiles.length<1||source.profiles.length>4)throw Error('Expected a legacy v4 family export with one to four children.');
const hash=createHash('sha256').update(raw).digest('hex'),map=new Map();
function remap(id){if(!map.has(id)){const h=createHash('sha256').update(parent+hash+id).digest('hex');map.set(id,[h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20,32)].join('-'));}return map.get(id);}
for(const p of source.profiles){remap(p.id);if(!Number.isSafeInteger(p.stars)||p.stars<0)throw Error('Invalid imported star balance.');}
for(const row of source.collections??[])remap(row.id);
for(const row of [...(source.reading?.attempts??[]),...(source.experience?.responses??[])])remap(row.id);
function discover(value){if(Array.isArray(value)){value.forEach(discover);return;}if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){if(['sessionId','session_id','teamId'].includes(key)&&typeof item==='string')remap(item);if(key==='session'&&item?.id)remap(item.id);if(key==='savedSessions')for(const s of item??[])remap(s.id);if(key==='runs')for(const s of Object.values(item??{}))if(s?.id)remap(s.id);discover(item);}
}
discover(source);
const fields=new Set(['id','childId','child_id','profileId','profile_id','partnerId','sourceId','sessionId','session_id','teamId']);
function transform(value){if(Array.isArray(value))return value.map(transform);if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,fields.has(k)&&typeof v==='string'&&map.has(v)?map.get(v):transform(v)]));}
const bundle=transform(source);bundle.childMap=Object.fromEntries(source.profiles.map(p=>[p.id,map.get(p.id)]));bundle.profiles=bundle.profiles.map(normalizeExplorer);
const {data,error}=await client.rpc('cq_import',{p_parent:parent,p_bundle:bundle,p_hash:hash});
if(error)throw Error('Import failed; no partial import was committed. '+error.message);
console.log(JSON.stringify(data));
