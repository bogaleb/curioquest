'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ParentGate} from '@/components/learning/parent-gate';
type Item={id:string;title:string;slug:string;url:string|null;media_type:string};
export function MediaLibrary(){
 const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[gate,setGate]=useState(false),[revision,setRevision]=useState(0),[loaded,setLoaded]=useState(false);
 useEffect(()=>{const c=new AbortController();fetch('/api/media',{signal:c.signal}).then(async r=>{const d=await r.json() as {items:Item[];error?:string};if(!r.ok)throw Error(d.error);setItems(d.items);setLoaded(true);setError('');}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[revision]);
 return <main className="app-shell"><section className="panel" style={{maxWidth:720,margin:'5vh auto',padding:32}}>
 <Link href="/">Back to adventures</Link><h1>Family media</h1><p>Private recordings, captions, images and videos for your family. Existing animated scenes remain available when no video is assigned.</p>
 <button className="secondary" onClick={()=>setGate(true)}>Unlock Parent Corner</button>
 {gate&&<ParentGate onClose={()=>setGate(false)} onUnlocked={()=>{setGate(false);setRevision(n=>n+1);}}/>}
 {error&&<p className="error" role="alert">{error}</p>}
 {loaded&&<><form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');try{const r=await fetch('/api/media',{method:'POST',body:new FormData(form)});const d=await r.json() as {error?:string};if(!r.ok)throw Error(d.error);form.reset();setRevision(n=>n+1);}catch(e){setError(e instanceof Error?e.message:'Try again.');}finally{setBusy(false);}}}>
 <label>Title<input name="title" required maxLength={100}/></label>
 <label>Media ID<input name="slug" required pattern="[a-z0-9_-]{1,80}" placeholder="missing-map"/><small>Use missing-map for the current episode, missing-map-captions for its captions, or a reading skill ID such as sound_m for a phoneme recording.</small></label>
 <label>File (up to 10 MB)<input name="file" type="file" required accept="image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,video/mp4,text/vtt"/></label>
 <button className="primary" disabled={busy}>{busy?'Uploading…':'Upload private media'}</button></form>
 <ul>{items.map(item=><li key={item.id}>{item.url?<a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>:item.title} ({item.slug}) <button className="secondary" disabled={busy} onClick={async()=>{if(!window.confirm('Delete this media file?'))return;setBusy(true);try{const r=await fetch('/api/media',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,confirm:true})});if(!r.ok)throw Error('Deletion failed. Please retry.');setRevision(n=>n+1);}catch(e){setError(e instanceof Error?e.message:'Try again.');}finally{setBusy(false);}}}>Delete</button></li>)}</ul></>}
 </section></main>;
}
