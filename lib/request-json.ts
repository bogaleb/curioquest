export class RequestBodyError extends Error {
  constructor(message:string,public status:number){super(message);}
}
export async function requestJson(request:Request,maxBytes:number):Promise<Record<string,unknown>> {
  if(Number(request.headers.get("content-length"))>maxBytes)throw new RequestBodyError("That request is too large.",413);
  const reader=request.body?.getReader();
  if(!reader)throw new RequestBodyError("Please send a valid request.",400);
  const chunks:Uint8Array[]=[];let length=0;
  try{
    while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.byteLength;
      if(length>maxBytes){await reader.cancel();throw new RequestBodyError("That request is too large.",413);}chunks.push(chunk.value);}
  }finally{reader.releaseLock();}
  const all=new Uint8Array(length);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength;}
  let value:unknown;
  try{value=JSON.parse(new TextDecoder().decode(all));}catch{throw new RequestBodyError("Please send a valid request.",400);}
  if(!value||typeof value!=="object"||Array.isArray(value))throw new RequestBodyError("Please send a valid request.",400);
  return value as Record<string,unknown>;
}
