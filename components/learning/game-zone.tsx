"use client";
import { useState } from "react";
import { ArrowRight, Check, Heart, LockKeyhole, Play, Search, Sparkles, Volume2 } from "lucide-react";
import { arcadeGames, arcadeKey, type ArcadeGameId } from "@/lib/arcade";
import type { ExplorerProfile } from "@/lib/explorers";
import { readAloud } from "@/lib/speech";

type Props = { profile: ExplorerProfile; busy: boolean; onStart: (game: ArcadeGameId, level: number) => void; onFavorite: (game: ArcadeGameId, favorite: boolean) => void; onContinue: () => void };
export function GameZone({profile,busy,onStart,onFavorite,onContinue}:Props) {
  const [filter,setFilter]=useState("all"),[query,setQuery]=useState("");
  const completed=arcadeGames.reduce((total,g)=>total+(profile.arcade[arcadeKey(profile.grade,g.id)]?.levels.length??0),0);
  const games=arcadeGames.filter(g=>(filter==="all"||filter===g.subject||(filter==="favorites"&&profile.favorites.includes(g.id)))&&`${g.title} ${g.skills}`.toLowerCase().includes(query.toLowerCase()));
  const active=profile.session&&profile.session.index<((profile.session as unknown as {total?:number}).total??profile.session.questions?.length??0);
  return <div className="game-zone"><section className="arcade-hero"><div><span className="arcade-kicker"><Sparkles size={16}/>THE CURIOSITY PLAYGROUND</span>
    <h1>Big ideas.<br/><em>Little adventures.</em></h1><p>Code a robot. Cook up numbers. Build a word.<br/>Find a game that makes you wonder.</p>
    <div className="arcade-hero-meta"><span>8 game collections</span><span>24 short missions</span><span>No timers. No races.</span></div>
    <button className="arcade-listen" onClick={()=>readAloud("Welcome to the curiosity playground! Guide a robot, cook up numbers, build words, or explore a story. Choose a game. There is no rush.")}><Volume2 size={18}/>Nova, show me around</button></div>
    <img className="arcade-hero-image" src="/game-zone.png" width={1536} height={1024} decoding="async" alt="Nova and a friendly robot explore a storybook carnival with a toy train, fruit, flowers, and building blocks."/></section>
    {active&&<section className="resume-game"><div><Play size={22}/><span><strong>Your adventure is waiting</strong><small>Your place is saved. Finish this quest before starting another.</small></span></div><button className="primary" disabled={busy} onClick={onContinue}>Continue<ArrowRight size={18}/></button></section>}
    <div className="game-zone-toolbar"><div className="game-filters" role="group" aria-label="Game categories">{[["all","All adventures"],["reading","Words & stories"],["math","Numbers & shapes"],["logic","Brain gym"],["favorites","My favorites"]].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
      <label className="game-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a game" aria-label="Find a game"/></label></div>
    <div className="game-grid">{games.map(game=>{const levels=profile.arcade[arcadeKey(profile.grade,game.id)]?.levels??[],favorite=profile.favorites.includes(game.id);return <article className={`game-card ${game.color}`} key={game.id}>
      <div className="game-card-scene"><span className="game-card-buddy" aria-hidden="true">{game.emoji}</span><span className="game-scene-star" aria-hidden="true">✦</span><span className="game-scene-dot" aria-hidden="true"/>
        <button className="game-favorite" disabled={busy} aria-label={`${favorite?"Remove":"Save"} ${game.title} ${favorite?"from":"to"} favorites`} aria-pressed={favorite} onClick={()=>onFavorite(game.id,!favorite)}><Heart size={19} fill={favorite?"currentColor":"none"}/></button>
        <span className="game-card-tag">{game.subject==="logic"?"BRAIN GYM":game.subject==="math"?"NUMBER PLAY":"WORDS & STORIES"}</span></div>
      <div className="game-card-body"><h2>{game.title}</h2><p>{game.description}</p><small className="game-skills">{game.skills}</small>
      <div className="game-missions">{game.missions.map((mission,level)=>{const done=levels.includes(level),locked=level>0&&!levels.includes(level-1);return <button key={mission} disabled={busy||!!active||locked} onClick={()=>onStart(game.id,level)} aria-label={`${mission}, ${done?"explore again":locked?"finish earlier mission first":"4 discoveries, about 8 minutes"}`}>
        <span className={`mission-dot ${done?"done":""}`}>{done?<Check size={15}/>:locked?<LockKeyhole size={13}/>:level+1}</span><span>{mission}<small>{done?"Explore again":"4 discoveries"}</small></span><ArrowRight size={16}/></button>;})}</div></div>
    </article>;})}</div>
    {!games.length&&<div className="game-empty"><span>🔎</span><h2>{filter==="favorites"?"Your favorites will live here":"Try another little search"}</h2><p>{filter==="favorites"?"Tap the heart on a game you love to find it here next time.":"Search for words, numbers, shapes, memory, or a game name."}</p><button className="secondary" onClick={()=>{setFilter("all");setQuery("");}}>See all games</button></div>}
    <section className="play-passport"><div><span className="eyebrow">YOUR PLAYGROUND PASSPORT</span><h2>Every path has a little wonder.</h2><p>{completed} of 24 missions explored. Take your time collecting memories.</p></div><div className="passport-stamps">{arcadeGames.map(game=><div key={game.id} className={(profile.arcade[arcadeKey(profile.grade,game.id)]?.levels.length??0)===3?"stamped":""}><span>{game.emoji}</span><small>{game.title}</small></div>)}</div></section>
    <p className="playground-break">🌿 One little mission is plenty. Your next adventure will be here after a stretch, a story, or some outdoor play.</p>
  </div>;
}

export function GameZoneInvitation({onOpen}:{onOpen:()=>void}) {
  return <section className="game-zone-invitation"><div className="invitation-toys" aria-hidden="true">🤖 🥞 🚂</div><div><span className="eyebrow">NEW PLACES TO PLAY</span><h2>Welcome to the Game Zone</h2><p>Eight playful collections. Robots, stories, puzzles, and tiny discoveries.</p></div><button className="primary" onClick={onOpen}>Let’s play<ArrowRight size={19}/></button></section>;
}
