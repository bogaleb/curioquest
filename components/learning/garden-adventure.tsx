"use client";

import { useState } from "react";
import { ArrowRight, Check, Leaf, Save } from "lucide-react";
import { campaignChapters } from "@/lib/campaign";
import { gardenChallenge, gardenPieces, type GardenPiece, type AdventureProgress } from "@/lib/adventure";

type Props = { progress: AdventureProgress; busy: boolean; onStart:()=>void; onGarden:()=>void };
export function StoryTrail({progress,busy,onStart,onGarden}:Props) {
  const chapter=campaignChapters.find((_,i)=>!progress.chapters.includes(i));
  return <section className="story-trail">
    <div className="story-heading"><span className="story-medallion" aria-hidden="true">🌱</span><div>
      <div className="eyebrow">NOVA’S STORY ADVENTURE</div><h2>The Mystery of the Missing Seeds</h2>
      <p>{chapter?.story??"Mystery solved! The seeds are safe, and a garden of possibilities is yours."}</p>
    </div></div>
    <ol className="chapter-path">{campaignChapters.map((item,i)=><li key={item.id} className={progress.chapters.includes(i)?"complete":chapter===item?"current":""}>
      <span aria-hidden="true">{progress.chapters.includes(i)?"✓":item.emoji}</span><div><small>CHAPTER {i+1}</small><strong>{item.title}</strong>
      <small>{progress.chapters.includes(i)?"Discovered":chapter===item?"Your next adventure":"Coming next"}</small></div>
    </li>)}</ol>
    <div className="story-actions"><button className="primary" disabled={busy} onClick={chapter?onStart:onGarden}>
      {chapter?`Start chapter ${campaignChapters.indexOf(chapter)+1}`:"Create in my garden"}<ArrowRight size={18}/></button>
      <span>{chapter?"4 discoveries · about 8 minutes":"All three chapters discovered"}</span></div>
  </section>;
}

export function GardenLab({progress,busy,onSave,onOffline,offline=true}:{
  progress:AdventureProgress;busy:boolean;offline?:boolean;onSave:(garden:GardenPiece[])=>Promise<boolean>;onOffline:()=>Promise<boolean>;
}) {
  const [garden,setGarden]=useState<GardenPiece[]>([...progress.garden]);
  const [piece,setPiece]=useState<GardenPiece>("flower");
  const [saved,setSaved]=useState(false);
  const [checked,setChecked]=useState(false);
  const unlocked=progress.chapters.includes(2);
  const checklist=gardenChallenge(garden);
  return <div className="garden-lab">
    <div className="eyebrow">MAKE A LITTLE WONDER</div><h1>Your CurioGarden</h1>
    <p className="lead">A home for plants, a path for friends. What will you create?</p>
    <div className="garden-layout"><section className="garden-workbench">
      <div className="garden-sky"><span>☁️</span><strong>Build. Notice. Try another way.</strong><span>☀️</span></div>
      <div className="garden-board" role="group" aria-label="Garden building spaces">
        {garden.map((value,index)=><button key={index} type="button" disabled={busy}
          aria-label={`Row ${Math.floor(index/6)+1}, space ${index%6+1}: ${gardenPieces.find(p=>p.id===value)?.label}. Place ${gardenPieces.find(p=>p.id===piece)?.label}.`}
          onClick={()=>{setGarden(g=>g.map((old,i)=>i===index?piece:old));setSaved(false);setChecked(false);}}>
          <span aria-hidden="true">{gardenPieces.find(p=>p.id===value)?.emoji||"·"}</span>
        </button>)}
      </div>
      <div className="garden-palette" role="group" aria-label="Building pieces">{gardenPieces.filter(p=>(p.id!=="sunflower"||unlocked)&&(p.id!=="treehouse"||progress.unlocks.includes("Team treehouse"))).map(p=><button type="button" key={p.id}
        aria-pressed={piece===p.id} aria-label={p.label} className={piece===p.id?"chosen":""} onClick={()=>setPiece(p.id)}>
        <span aria-hidden="true">{p.emoji||"✕"}</span><small>{p.label}</small></button>)}</div>
      <div className="garden-actions"><button className="secondary" onClick={()=>setChecked(true)}>Try the garden challenge</button>
        <button className="primary" disabled={busy} onClick={async()=>{setSaved(await onSave(garden));}}><Save size={18}/>{busy?"Saving…":"Save my garden"}</button></div>
      {saved&&<p role="status" className="success">Your garden is saved. Come back whenever you have a new idea.</p>}
    </section><aside><section className="panel garden-challenge"><Leaf size={28}/><h2>A garden for friends</h2>
      <p>Try these ideas, or build something all your own.</p>
      <ul>{checklist.map(c=><li key={c.label}><span>{checked&&c.done?"✓":"○"}</span>{c.label}</li>)}</ul>
      {checked&&<p role="status">{checklist.every(c=>c.done)?"Plants, water, and a path! Tell a grown-up how you planned your garden.":"Engineers try ideas. What would you like to add next?"}</p>}
      <p className="form-note">Your design is yours. Creativity does not get a score.</p>
    </section>{unlocked&&offline&&<section className="panel offline-card"><div className="eyebrow">YOUR NEXT ADVENTURE IS REAL</div><h2>Grow a seed together</h2>
      <p>With a grown-up, put a seed in a small pot of soil. Add a little water. Find a bright spot and check it each day.</p>
      <p>Draw what you notice. What do you predict will happen next?</p>
      <button className="secondary" disabled={busy||!!progress.offline.requestedAt} onClick={onOffline}><Check size={18}/>
        {progress.offline.confirmedAt?"Shared with your grown-up":progress.offline.requestedAt?"Ready for your grown-up to confirm":"We tried our seed mission"}</button>
    </section>}</aside></div>
  </div>;
}
