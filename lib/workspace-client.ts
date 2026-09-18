export async function workspaceRequest<T>(body:Record<string,unknown>):Promise<T>{
  const response=await fetch('/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await response.json() as T & {error?:string};if(!response.ok)throw new Error(data.error||'Please try again.');return data;
}
export async function workspaceCollection<T>(profile:string,kind:string,signal?:AbortSignal,page=0):Promise<T[]>{
  const response=await fetch(`/api/workspace?profile=${encodeURIComponent(profile)}&kind=${encodeURIComponent(kind)}&page=${page}`,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
  const data=await response.json() as {items:T[];error?:string};if(!response.ok)throw new Error(data.error||'Please try again.');return data.items;
}
