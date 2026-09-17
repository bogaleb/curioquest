import { database } from "@/db/raw";
const cookieName="curioquest_parent";
const sessionDuration=15*60*1000;
type LockRow={salt:string;pin_hash:string;recovery_hash:string;attempts:number;window_until:number;owner_identity:string|null};
const encoder=new TextEncoder();
function hex(bytes:ArrayBuffer|Uint8Array){return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,"0")).join("");}
function random(){return hex(crypto.getRandomValues(new Uint8Array(32)));}
async function digest(value:string){return hex(await crypto.subtle.digest("SHA-256",encoder.encode(value)));}
async function pinHash(pin:string,salt:string){
  const key=await crypto.subtle.importKey("raw",encoder.encode(pin),"PBKDF2",false,["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:encoder.encode(salt),iterations:100000},key,256));
}
function equal(a:string,b:string){if(a.length!==b.length)return false;let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0;}
function identity(request:Request){
  const id=request.headers.get("oai-authenticated-user-id");
  const local=["localhost","127.0.0.1","[::1]"].includes(new URL(request.url).hostname);
  if(local&&(!id||id==="local_seedy"))return "local-family";
  if(id)return id;
  return null;
}
function token(request:Request){return request.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith(cookieName+"="))?.slice(cookieName.length+1)??"";}
function cookie(request:Request,value:string,maxAge=900){return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol==="https:"?"; Secure":""}`;}
async function lock(){return database().prepare("SELECT * FROM parent_lock WHERE id = 1").first<LockRow>();}
export async function familyAuthorized(request:Request){
  const owner=identity(request);
  if(!owner)return false;
  const existing=await lock();
  // Initial setup is performed by the sole viewer of the owner-private Site.
  // Once configured, signed-in users from other accounts cannot read this family.
  return !existing || existing.owner_identity===owner;
}
export async function parentAuthorized(request:Request){
  const owner=identity(request),value=token(request);
  if(!owner||!/^[a-f0-9]{64}$/.test(value))return false;
  return !!(await database().prepare("SELECT token_hash FROM parent_sessions WHERE token_hash = ? AND identity = ? AND expires_at > ?").bind(await digest(value),owner,Date.now()).first());
}
export async function parentStatus(request:Request){return {configured:!!(await lock()),unlocked:await parentAuthorized(request)};}
function reply(body:unknown,status=200,extra:Record<string,string>={}){return Response.json(body,{status,headers:{"Cache-Control":"no-store",...extra}});}
export async function parentAction(request:Request,input:Record<string,unknown>){
  const owner=identity(request);
  if(!owner)return reply({error:"Sign in to your private family workspace first."},401);
  const db=database(),existing=await lock(),now=Date.now();
  if(existing&&existing.owner_identity!==owner)return reply({error:"This family belongs to a different signed-in account."},403);
  if(input.action==="lock") {
    await db.prepare("DELETE FROM parent_sessions WHERE token_hash = ?").bind(await digest(token(request))).run();
    return reply({configured:!!existing,unlocked:false},200,{"Set-Cookie":cookie(request,"",0)});
  }
  const pin=input.pin;
  if(typeof pin!=="string"||!/^\d{6}$/.test(pin))return reply({error:"Use a six-digit parent PIN."},400);
  if(!["setup","unlock","recover"].includes(String(input.action)))return reply({error:"Choose a parent action."},400);
  if(input.action==="setup"&&existing)return reply({error:"A parent PIN is already set. Unlock Parent Corner instead."},409);
  if(input.action!=="setup"&&!existing)return reply({error:"Set a parent PIN first."},409);
  let recoveryCode:string|undefined,activeSalt=existing?.salt;
  if(existing) {
    // Consume one attempt atomically before checking a credential. Parallel calls cannot bypass the limit.
    const allowed=await db.prepare("UPDATE parent_lock SET attempts = CASE WHEN window_until <= ? THEN 1 ELSE attempts + 1 END, window_until = CASE WHEN window_until <= ? THEN ? ELSE window_until END WHERE id = 1 AND (window_until <= ? OR attempts < 5)").bind(now,now,now+sessionDuration,now).run();
    if(!allowed.meta.changes)return reply({error:"Too many tries. Please wait 15 minutes before trying again."},429,{"Retry-After":"900"});
    const valid=input.action==="recover"
      ? typeof input.recoveryCode==="string"&&equal(await digest(input.recoveryCode.trim()),existing.recovery_hash)
      : equal(await pinHash(pin,existing.salt),existing.pin_hash);
    if(!valid)return reply({error:input.action==="recover"?"That recovery code did not match.":"That PIN did not match. Please try again."},403);
  }
  if(input.action==="setup"||input.action==="recover") {
    const salt=random();activeSalt=salt;recoveryCode=random();
    const hash=await pinHash(pin,salt),recoveryHash=await digest(recoveryCode);
    if(input.action==="setup") {
      const result=await db.prepare("INSERT OR IGNORE INTO parent_lock (id,salt,pin_hash,recovery_hash,owner_identity,attempts,window_until) VALUES (1,?,?,?,?,0,0)").bind(salt,hash,recoveryHash,owner).run();
      if(!result.meta.changes)return reply({error:"A parent PIN was just set in another window. Unlock with that PIN."},409);
    } else {
      const changed=await db.prepare("UPDATE parent_lock SET salt = ?, pin_hash = ?, recovery_hash = ?, attempts = 0, window_until = 0 WHERE id = 1 AND recovery_hash = ?").bind(salt,hash,recoveryHash,existing!.recovery_hash).run();
      if(!changed.meta.changes)return reply({error:"This recovery code has already been used."},409);
      await db.prepare("DELETE FROM parent_sessions").run();
    }
  }
  const sessionToken=random();
  const results=await db.batch([
    db.prepare("UPDATE parent_lock SET attempts = 0, window_until = 0 WHERE id = 1"),
    db.prepare("DELETE FROM parent_sessions WHERE expires_at <= ? OR identity = ?").bind(now,owner),
    db.prepare("INSERT INTO parent_sessions (token_hash,identity,expires_at) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM parent_lock WHERE id = 1 AND salt = ? AND owner_identity = ?)").bind(await digest(sessionToken),owner,now+sessionDuration,activeSalt,owner),
  ]);
  if(!results[2].meta.changes)return reply({error:"The parent PIN changed during this request. Please unlock again."},409);
  return reply({configured:true,unlocked:true,recoveryCode},200,{"Set-Cookie":cookie(request,sessionToken)});
}
