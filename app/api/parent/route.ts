import {withFamily} from '@/lib/backend/context';
import { parentAction, parentStatus, familyAuthorized } from "@/lib/parent-security";
import { requestJson, RequestBodyError } from "@/lib/request-json";
async function get(request:Request){
  try{if(!(await familyAuthorized(request)))return Response.json({error:"Sign in with this family's account to open Parent Corner."},{status:403});return Response.json(await parentStatus(request),{headers:{"Cache-Control":"no-store"}});}
  catch{return Response.json({error:"Parent settings could not be loaded. Try again shortly."},{status:503});}
}
async function post(request:Request){
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Request not allowed."},{status:403});
  try {
    return await parentAction(request,await requestJson(request,2048));
  }catch(error){if(error instanceof RequestBodyError)return Response.json({error:error.message},{status:error.status});return Response.json({error:"Parent settings could not be saved. Please try again."},{status:503});}
}

export const GET = withFamily(get);
export const POST = withFamily(post);
