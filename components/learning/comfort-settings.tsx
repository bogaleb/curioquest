"use client";
import { useState } from "react";
import type { ExplorerProfile } from "@/lib/explorers";
export function ComfortSettings({preferences,busy,onSave}:{preferences:ExplorerProfile["preferences"];busy:boolean;onSave:(value:ExplorerProfile["preferences"])=>Promise<boolean>}) {
  const [saved,setSaved]=useState(false);
  return <section className="panel comfort-settings"><h2>Their comfortable way to play</h2><p>These settings stay with this explorer on every device.</p>
    <form onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);setSaved(await onSave({autoRead:data.has("autoRead"),reducedMotion:data.has("reducedMotion"),paused:data.has("paused")}));}}>
      <label><input type="checkbox" name="autoRead" defaultChecked={preferences.autoRead}/><span><strong>Read activities aloud</strong><small>Nova reads new prompts and stories when an activity opens. Uses this device’s voice.</small></span></label>
      <label><input type="checkbox" name="reducedMotion" defaultChecked={preferences.reducedMotion}/><span><strong>Keep movement gentle</strong><small>Reduce decorative motion and transitions.</small></span></label>
      <label><input type="checkbox" name="paused" defaultChecked={preferences.paused}/><span><strong>Pause screen adventures</strong><small>Keep their place saved while your family takes a break. Uncheck this here to resume.</small></span></label>
      <button className="secondary" disabled={busy}>Save comfort settings</button>{saved&&<p role="status" className="success">Comfort settings saved.</p>}
    </form></section>;
}
