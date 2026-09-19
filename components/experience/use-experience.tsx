'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import type {ExperienceView,RunMode} from '@/lib/experience/types';
async function load(id:string,mode:RunMode,signal?:AbortSignal){const r=await fetch(`/api/experience?profile=${encodeURIComponent(id)}&mode=${mode}`,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});const data=await r.json() as ExperienceView;if(!r.ok)throw Error(data.error);return data;}
export function useExperience(profileId:string,mode:RunMode='daily'){
 const [data,setData]=useState<ExperienceView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState<Record<string,unknown>|null>(null),lock=useRef(false);
 useEffect(()=>{const c=new AbortController();load(profileId,mode,c.signal).then(d=>{if(!c.signal.aborted)setData(d);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[profileId,mode]);
 const refresh=useCallback(async()=>{try{setData(await load(profileId,mode));setError('');setPending(null);}catch(e){setError(e instanceof Error?e.message:'Try again.');}},[profileId,mode]);
 async function act(action:string,extra:Record<string,unknown>={}){if(!data||lock.current)return null;lock.current=true;setBusy(true);setError('');const body={action,profile:profileId,mode,revision:data.revision,run:data.run?.id,...extra};try{const r=await fetch('/api/experience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const next=await r.json() as ExperienceView;if(!r.ok)throw Error(next.error);setData(next);setPending(null);return next;}catch(e){setPending({action,...extra});setError(e instanceof Error?e.message:'Your work could not be saved. Try again.');return null;}finally{lock.current=false;setBusy(false);}}
 return {data,busy,error,act,refresh,pending};
}
export function ExperienceError({error,refresh,retry,busy}:{error:string;refresh:()=>void;retry?:()=>void;busy:boolean}){return error?<div className="error" role="alert">{error}<div className="studio-actions">{retry&&<button className="secondary" disabled={busy} onClick={retry}>Retry save</button>}<button className="secondary" disabled={busy} onClick={refresh}>Refresh saved place</button></div></div>:null;}
