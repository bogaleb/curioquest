import { database } from "@/db/raw";
import { parentAuthorized } from "@/lib/parent-security";
import { normalizeExplorer } from "@/lib/explorers";
export async function GET(request:Request){
  try {
    if(!(await parentAuthorized(request)))return Response.json({error:"Unlock Parent Corner before downloading learning records."},{status:403,headers:{"Cache-Control":"no-store"}});
    const rows=await database().prepare("SELECT data FROM explorers ORDER BY rowid").all<{data:string}>();
    const items=await database().prepare('SELECT id,profile_id,kind,data,revision,updated_at FROM workspace_items').all<{id:string;profile_id:string;kind:string;data:string;revision:number;updated_at:string}>();
    const readingProfiles=await database().prepare('SELECT child_id,data,revision FROM reading_profiles').all<{child_id:string;data:string;revision:number}>();
    const readingAttempts=await database().prepare('SELECT data FROM reading_attempts ORDER BY created_at').all<{data:string}>();
    return Response.json({schemaVersion:3,reading:{profiles:readingProfiles.results.map(r=>({...r,data:JSON.parse(r.data)})),attempts:readingAttempts.results.map(r=>JSON.parse(r.data))},exportedAt:new Date().toISOString(),profiles:rows.results.map(row=>normalizeExplorer(JSON.parse(row.data))),collections:items.results.map(item=>({...item,data:JSON.parse(item.data)}))},{headers:{"Cache-Control":"no-store","Content-Disposition":"attachment; filename=curioquest-learning-records.json"}});
  }catch{return Response.json({error:"Learning records could not be downloaded. Try again shortly."},{status:503});}
}
