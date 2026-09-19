import { parentId } from '@/lib/backend/context';
import { commit } from '@/lib/backend/repository';
const cookieName = 'curioquest_parent';
function token(request: Request) { return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1) ?? ''; }
function cookie(request: Request, value: string, age = 900) { return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol==='https:'?'; Secure':''}`; }
type GateReply = {configured:boolean;unlocked:boolean;status?:number;error?:string;recoveryCode?:string;cookieToken?:string};
export async function familyAuthorized(_request: Request) { void _request; return !!parentId(); }
export async function parentStatus(request: Request) { return commit<GateReply>('gate', {action:'status',token:token(request)}); }
export async function parentAuthorized(request: Request) { return (await parentStatus(request)).unlocked; }
export async function parentAction(request: Request, input: Record<string,unknown>) {
  if (!['setup','unlock','recover','lock'].includes(String(input.action))) return Response.json({error:'Choose a parent action.'},{status:400});
  if(input.action!=='lock' && (typeof input.pin!=='string'||!/^\d{6}$/.test(input.pin))) return Response.json({error:'Use a six-digit parent PIN.'},{status:400});
  const {status=200,cookieToken,...body}=await commit<GateReply>('gate',{action:input.action,pin:input.pin,recoveryCode:input.recoveryCode,token:token(request)});
  const headers: Record<string,string>={'Cache-Control':'no-store'};
  if(cookieToken)headers['Set-Cookie']=cookie(request,cookieToken);
  if(input.action==='lock')headers['Set-Cookie']=cookie(request,'',0);
  if(status===429)headers['Retry-After']='900';
  return Response.json(body,{status,headers});
}
