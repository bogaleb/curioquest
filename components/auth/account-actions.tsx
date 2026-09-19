'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
export function AccountActions(){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <><Link className="nav-item" href="/account/media">Family media</Link><button className="nav-item" disabled={busy} onClick={async()=>{
  if(!window.confirm('Sign out of this parent account? Save any unfinished artwork first.'))return;
  setBusy(true);setError('');try{const r=await fetch('/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sign-out'})});
   if(!r.ok)throw Error('Sign-out failed. Please try again.');router.replace('/auth/sign-in');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Try again.');setBusy(false);}
 }}>{busy?'Signing out…':'Sign out'}</button>{error&&<p role="alert">{error}</p>}</>;
}
