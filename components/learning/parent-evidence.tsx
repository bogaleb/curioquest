"use client";
import { useState } from "react";
import { Leaf, Check } from "lucide-react";
import type { PublicExplorer } from "@/lib/explorer-view";
import { skillById } from "@/lib/skill-graph";
import { progressionState } from "@/lib/mastery";
import { gardenPieces } from "@/lib/adventure";
import { arcadeGames, arcadeKey } from "@/lib/arcade";

const homeIdeas:Record<string,string>={
  reading:"At story time, pause and ask: “Which clue helped you know?” Listen to their explanation together.",
  math:"At dinner, count the places together. We need six forks and have four — how many more should we bring?",
  logic:"Make a repeating pattern with two kinds of toys. Take turns adding the next piece and describing the rule.",
};

export function ParentEvidence({profile,busy,onConfirm}:{
  profile:PublicExplorer;busy:boolean;onConfirm:()=>Promise<boolean>;
}) {
  const [expanded,setExpanded]=useState<string|null>(null);
  const [now]=useState(()=>Date.now());
  const cutoff=now-7*24*60*60*1000;
  const recent=profile.history.filter(h=>Date.parse(h.date)>=cutoff);
  const skills=Object.entries(profile.skillMastery).filter(([,m])=>m.attemptCount>0)
    .sort((a,b)=>a[1].score-b[1].score);
  const practiced=new Set(recent.flatMap(h=>h.skillIds??[])).size;
  const due=skills.filter(([,m])=>m.nextReviewAt&&Date.parse(m.nextReviewAt)<=now).length;
  const focus=skills[0]?skillById.get(skills[0][0]):undefined;
  return <section className="evidence-dashboard">
    <section className="panel parent-game-summary"><div className="section-heading"><h2>Learning through play</h2><a className="text-button" href="/api/parent/export">Download family learning records</a></div>
      <p>Game missions contribute to the same skill evidence as Daily Quests. Passport stamps celebrate participation, not mastery.</p>
      <div className="parent-game-grid">{arcadeGames.map(game=>{const progress=profile.arcade[arcadeKey(profile.grade,game.id)];return <div key={game.id}><span aria-hidden="true">{game.emoji}</span><strong>{game.title}</strong><small>{progress?.levels.length??0}/3 missions explored</small></div>;})}</div>
    </section>
    {profile.discovery&&<section className="panel discovery-summary"><div className="eyebrow">GETTING TO KNOW YOUR EXPLORER</div>
      <h2>Nova’s starting paths</h2><p>From six welcome discoveries on {new Date(profile.discovery.completedAt).toLocaleDateString()}. These are starting suggestions, not a grade or diagnosis. Future practice keeps adjusting the path.</p>
      <div className="discovery-paths">{(["reading","math","logic"] as const).filter(subject=>profile.discovery!.subjects[subject]).map(subject=><span key={subject}>
        <strong>{subject==="reading"?"Word Forest":subject==="math"?"Number City":"Logic Mountain"}</strong><br/>
        {profile.discovery!.subjects[subject]!.startingLevel===2?"Ready for a next step":"Begin with supported discoveries"}
      </span>)}</div>
      {profile.discovery.grade!==profile.grade&&<p className="form-note">These observations came from the previous learning track. A new welcome adventure is available on your child’s home screen.</p>}
    </section>}
    <div className="section-heading"><h2>{profile.name}’s week of discovery</h2><span>Last 7 days</span></div>
    <div className="weekly-stats"><div><strong>{recent.length}</strong><span>quests explored</span></div>
      <div><strong>{practiced}</strong><span>skills practiced</span></div>
      <div><strong>{due}</strong><span>ready to revisit</span></div>
      <div><strong>{profile.adventure.chapters.length}/3</strong><span>story chapters</span></div></div>
    <div className="parent-grid"><section className="panel"><h2>Growing skills</h2>
      {!skills.length?<p>Skill evidence will appear after the next activity. Older quest totals are preserved; they don’t tell us which individual skills were learned.</p>:
      <div className="evidence-list">{skills.map(([id,m])=>{
        const skill=skillById.get(id); const state=progressionState(m);
        const label=state==="mastered"?"Secure":state==="strong"||state==="growing"?"Strengthening":"Developing";
        return <div className="evidence-item" key={id}><button className="evidence-toggle" aria-expanded={expanded===id} onClick={()=>setExpanded(expanded===id?null:id)}>
          <span><strong>{skill?.name??id}</strong><small>{label} · {m.attemptCount} observations</small></span><span className="evidence-label">{Math.round(m.score)}%</span></button>
          <div className="evidence-bar" aria-label={`Practice estimate ${Math.round(m.score)} percent`}><span style={{width:`${m.score}%`}}/></div>
          {expanded===id&&<div className="evidence-detail"><p>{skill?.description}</p>
            <p>{m.independentCorrect} independent successes · {m.activityTypes.length} activity format{m.activityTypes.length===1?"":"s"} · {m.sessionIds.length} sessions.</p>
            <p>Confidence: {Math.round(m.confidence)}%. {m.retainedReviews||0} successful delayed reviews.</p>
            <p>Next practice: {m.nextReviewAt?new Date(m.nextReviewAt).toLocaleDateString():"After more evidence"}.</p></div>}
        </div>;
      })}</div>}
      <p className="form-note">Practice estimates are early learning signals. “Secure” needs independent success, different activities, and recall after a delay.</p>
    </section><div><section className="panel tonight-card"><Leaf size={25}/><div className="eyebrow">FIVE MINUTES TOGETHER</div><h2>What to try tonight</h2>
      <p>{homeIdeas[focus?.subject??"reading"]}</p>{focus&&<p className="form-note">Supports {focus.name.toLowerCase()}, a skill your explorer is developing.</p>}
    </section><section className="panel"><h2>Creative portfolio</h2>
      {profile.adventure.gardenSavedAt?<><div className="portfolio-garden" aria-label="Saved garden">{profile.adventure.garden.map((piece,i)=><span key={i}>{gardenPieces.find(p=>p.id===piece)?.emoji||"·"}</span>)}</div>
        <p className="form-note">Garden saved {new Date(profile.adventure.gardenSavedAt).toLocaleDateString()}. Ask your child to explain their design.</p></>:<p>A saved Build Lab garden will appear here.</p>}
      {profile.adventure.offline.requestedAt&&<div className="offline-confirm"><h3>Real-world seed mission</h3>
        <p>{profile.adventure.offline.confirmedAt?"You confirmed this shared discovery.":"Your explorer says you tried the seed mission together."}</p>
        <button className="secondary" disabled={busy||!!profile.adventure.offline.confirmedAt} onClick={onConfirm}><Check size={18}/>{profile.adventure.offline.confirmedAt?"Confirmed":"Confirm we tried it together"}</button></div>}
    </section></div></div>
  </section>;
}
