"use client";

import Image from "next/image";
import { useContext, useState } from "react";
import { characterClip, clipPoster, routeClips } from "@/lib/character-clips";
import { CharacterClip, ClipComfortContext } from "./CharacterClip";
import { CharacterActivity } from "./CharacterActivity";

export function CharacterCorner({ route, clips }: { route?: string; clips?: string[] }) {
  const ids = clips ?? routeClips[route ?? ''] ?? [];
  const [selection, setSelection] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const comfort = useContext(ClipComfortContext);
  if (!ids.length) return null;
  const id = selection && ids.includes(selection) ? selection : ids[0];
  const clip = characterClip(id);

  return <section className="character-corner" aria-label="Watch and try with your explorer friends">
    <header className="character-heading"><div><span className="eyebrow">Little movies. Your big ideas.</span><h2>Watch a little. Try it yourself.</h2></div><span className="character-pill">Meet your explorer friends</span></header>
    <div className="character-shelf" aria-label="Choose a character scene">{ids.map(key => {
      const item = characterClip(key);
      return <button key={key} aria-pressed={id === key} onClick={() => { setSelection(key); setCelebrating(false); }}><Image src={clipPoster(key)} alt="" width={160} height={90} unoptimized/><span><strong>{item.friend}</strong><small>{item.title}</small></span></button>;
    })}</div>
    <div className="character-stage" key={id}>
      <div><h3 className="character-scene-title">{clip.title}</h3><CharacterClip key={celebrating ? clip.celebration : id} id={celebrating && clip.celebration ? clip.celebration : id}/>{celebrating && <button className="character-reset" onClick={() => setCelebrating(false)}>Back to the demonstration</button>}</div>
      <CharacterActivity kind={clip.activity} prompt={clip.prompt} disabled={comfort.paused} onComplete={() => { if (clip.celebration) setCelebrating(true); }}/>
    </div>
  </section>;
}
