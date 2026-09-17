"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
type ParentReply = {configured:boolean;unlocked:boolean;recoveryCode?:string;error?:string};

export function ParentGate({onClose,onUnlocked}:{onClose:()=>void;onUnlocked:()=>void}) {
  const [configured,setConfigured]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[recover,setRecover]=useState(false),[recoveryCode,setRecoveryCode]=useState("");
  useEffect(()=>{const controller=new AbortController();fetch("/api/parent",{signal:controller.signal}).then(async r=>{const d=await r.json() as ParentReply;if(!r.ok)throw Error(d.error);if(d.unlocked)onUnlocked();else setConfigured(d.configured);}).catch(e=>{if(e.name!=="AbortError")setError(e.message);});return ()=>controller.abort();},[onUnlocked]);
  async function submit(form:HTMLFormElement){
    if(busy)return;setError("");const data=new FormData(form),pin=String(data.get("pin"));
    if((!configured||recover)&&pin!==data.get("confirm")){setError("The two PINs need to match.");return;}
    setBusy(true);
    try{const r=await fetch("/api/parent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:recover?"recover":configured?"unlock":"setup",pin,recoveryCode:data.get("recovery")})});const d=await r.json() as ParentReply;if(!r.ok)throw Error(d.error);if(d.recoveryCode)setRecoveryCode(d.recoveryCode);else onUnlocked();}
    catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
  }
  return <div className="overlay"><section className="gate panel parent-pin-gate" role="dialog" aria-modal="true" aria-labelledby="parent-gate-title">
    <button className="close" disabled={busy} aria-label="Close Parent Corner" onClick={onClose}><X/></button><ShieldCheck size={35}/>
    <h2 id="parent-gate-title">{recoveryCode?"Keep your recovery code safe":recover?"Recover Parent Corner":configured?"A moment for grown-ups":"Set up Parent Corner"}</h2>
    {error&&<p className="error" role="alert">{error}</p>}
    {recoveryCode?<><p>Save this code somewhere private. It lets you replace a forgotten PIN. We won’t show it again.</p><code className="recovery-code">{recoveryCode}</code>
      <button className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(recoveryCode);}catch{setError("Select and copy the code above, or write it down.");}}}>Copy recovery code</button>
      <form onSubmit={e=>{e.preventDefault();onUnlocked();}}><label className="recovery-ack"><input type="checkbox" required/>I saved my recovery code</label><button className="primary">Open Parent Corner<Check size={18}/></button></form></>
      :configured===null?<p role="status">{error?"Close this window and try opening Parent Corner again.":"Opening parent settings…"}</p>:<>
        <p>{recover?"Enter your saved recovery code and choose a new six-digit PIN.":configured?"Enter your six-digit parent PIN. Parent settings lock again after 15 minutes.":"Choose a six-digit PIN to protect profile changes and parent settings on this family device."}</p>
        <form onSubmit={e=>{e.preventDefault();void submit(e.currentTarget);}}>
          {recover&&<label>Recovery code<input name="recovery" required autoComplete="off" maxLength={64}/></label>}
          <label>{configured&&!recover?"Parent PIN":"New parent PIN"}<input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete={configured&&!recover?"current-password":"new-password"} required placeholder="6 digits"/></label>
          {(!configured||recover)&&<label>Confirm PIN<input name="confirm" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="new-password" required placeholder="Same 6 digits"/></label>}
          <button className="primary" disabled={busy}>{busy?"One moment…":recover?"Set a new PIN":configured?"Open Parent Corner":"Save parent PIN"}<ArrowRight size={18}/></button>
        </form>{configured&&<button className="text-button" disabled={busy} onClick={()=>{setRecover(!recover);setError("");}}>{recover?"Back to PIN":"I have a recovery code"}</button>}
      </>}
  </section></div>;
}
