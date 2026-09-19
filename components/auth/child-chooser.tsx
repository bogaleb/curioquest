'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {avatarEmoji} from '@/lib/explorers';
import {AccountActions} from './account-actions';
type Child={id:string;name:string;grade:string;avatar:string};
export function ChildChooser(){
 const [children,setChildren]=useState<Child[]|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();fetch('/api/quest',{signal:controller.signal}).then(async r=>{
  const d=await r.json() as {error?:string;profiles:Child[]};if(!r.ok)throw Error(d.error);setChildren(d.profiles);setError('');
 }).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[retry]);
 return <main className="app-shell"><section className="panel" style={{maxWidth:720,margin:'8vh auto',padding:32}}>
  <Link className="brand" href="/">curioquest</Link><h1>Who&apos;s ready to explore?</h1><p>Choose your child&apos;s learning adventure.</p>
  {error&&<p className="error" role="alert">{error} <button onClick={()=>setRetry(n=>n+1)}>Try again</button></p>}
  {!children&&!error&&<p role="status">Opening your family…</p>}
  {children?.length===0&&<><p>Create an explorer for your child. No child email address is needed.</p><Link className="primary" href="/">Create your first explorer</Link></>}
  <div className="worlds-grid">{children?.map(child=><Link className="world-card" href={'/?child='+child.id} key={child.id}>
   <span className="avatar">{avatarEmoji(child.avatar)}</span><h2>{child.name}</h2><p>{child.grade==='prek'?'Pre-K':'Grade 1'}</p></Link>)}</div>
  <AccountActions/>
 </section></main>;
}
