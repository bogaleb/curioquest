"use client";
import { useState } from "react";
import { ArrowRight, Users, Check } from "lucide-react";
import { avatarEmoji } from "@/lib/explorers";
import type {PublicExplorer} from "@/lib/explorer-view";

type Props={profiles:PublicExplorer[];profile:PublicExplorer;busy:boolean;
  onStart:(partnerId:string)=>Promise<void>;onContinue:(id:string)=>Promise<void>;onComplete:()=>Promise<void>;onGarden:()=>void};

export function TeamQuest({profiles,profile,busy,onStart,onContinue,onComplete,onGarden}:Props) {
  const [partnerId,setPartnerId]=useState(profiles.find(p=>p.id!==profile.id)?.id??"");
  const team=profile.team;
  const partner=profiles.find(p=>p.id===team?.partnerId);
  const participants=partner?[profile,partner]:[];
  const done=(p:PublicExplorer)=>p.history.some(h=>h.teamId===team?.id);
  const finished=participants.length===2&&participants.every(done);
  return <section className="team-quest"><div className="eyebrow">TWO EXPLORERS. ONE DISCOVERY.</div><h1>The Garden Rescue Team</h1>
    <p className="lead">Take turns helping Nova. Every explorer has an important part to play.</p>
    <div className="team-banner"><span aria-hidden="true">🌳</span><div><h2>A treehouse for our friends</h2>
      <p>Gather seeds, read the garden labels, and finish the flower path. When both parts are ready, discover a treehouse together.</p></div></div>
    {team&&partner?<><div className="team-roles">{participants.map((p)=><section className="panel" key={p.id}>
      <span className="team-avatar" aria-hidden="true">{avatarEmoji(p.avatar)}</span><h2>{p.name}</h2>
      <div className="eyebrow">{p.grade==="prek"?"SEED DETECTIVE":"GARDEN PLANNER"}</div>
      <p>{p.grade==="prek"?"Count seeds, find a letter, and follow the flowers.":"Gather supplies, build a word, and finish the garden pattern."}</p>
      <button className="primary" disabled={busy||done(p)} onClick={()=>onContinue(p.id)}>{done(p)?<><Check size={18}/> My part is ready</>:<>Play my part <ArrowRight size={18}/></>}</button>
    </section>)}</div>
      {team.completedAt?<div className="team-celebration"><span>🏡</span><h2>Our team treehouse!</h2><p>You both helped the garden grow. Plan a new garden together in Build Lab.</p><button className="primary" onClick={onGarden}>Build together <ArrowRight size={18}/></button></div>
        :finished?<button className="primary" disabled={busy} onClick={onComplete}>Discover our treehouse <Users size={18}/></button>
        :<p className="gentle-team-note">Pass the device when your part is ready. There is no race — you are on the same team.</p>}
    </>:<section className="panel team-setup"><h2>Who’s joining {profile.name}?</h2><label>Choose your teammate<select value={partnerId} onChange={e=>setPartnerId(e.target.value)}>
      {profiles.filter(p=>p.id!==profile.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <p>Each explorer gets a small set of discoveries at their learning level.</p>
      <button className="primary" disabled={busy||!partnerId} onClick={()=>onStart(partnerId)}>Start our Team Quest <Users size={18}/></button></section>}
  </section>;
}
