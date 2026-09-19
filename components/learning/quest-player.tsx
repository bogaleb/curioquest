"use client";
import { ArrowLeft, ArrowRight, Lightbulb, Star, Trophy, Volume2 } from "lucide-react";
import { ActivityEngineView } from "./activity-engine";
import { StoryPage } from "./arcade-engines";
import { campaignChapters } from "@/lib/campaign";
import { gameById } from "@/lib/arcade";
import { readAloud } from "@/lib/speech";
import {skillById} from "@/lib/skill-graph";
import {useEffect} from 'react';
import {celebrate} from '@/lib/audio';
import type { PublicExplorer, QuestFeedback } from "@/lib/explorer-view";
import type { PublicQuestion } from "@/lib/activity-types";

const worldName=(id:string)=>({reading:"Word Forest",math:"Number City",logic:"Logic Mountain"}[id]??"Daily Quest");
export function activityNarration(question: PublicQuestion) {
  const story=question.passage?`${question.passage.title}. ${question.passage.text}. `:"";
  return story+question.prompt+(question.audioLabel?`. The word is ${question.audioLabel}.`:"")+(question.options.length?`. Your choices are: ${question.options.join(", ")}`:"");
}
export function QuestPlayer({profile,current,feedback,selected,busy,error,onBack,onAnswer,onHint,onNext,onReflect,onFeeling,onFinish}: {
  profile:PublicExplorer;current:PublicQuestion|null;feedback:QuestFeedback;selected:string;busy:boolean;error:string;
  onBack:()=>void;onAnswer:(value:string)=>void;onHint:()=>Promise<unknown>;onNext:()=>void;
  onReflect:(strategy:string)=>void;onFeeling:(value:string)=>void;onFinish:()=>void;
}) {
  const session=profile.session;
  useEffect(()=>{if(feedback?.correct)celebrate(session?.index===session?.total);},[feedback?.correct,session?.index,session?.total]);
  if(!session)return null;
  const game=gameById(session.gameId),chapter=session.chapter!==undefined?campaignChapters[session.chapter]:undefined;
  const practicedSkills=[...new Set(profile.history.find(item=>item.sessionId===session.id)?.skillIds??[])].map(id=>skillById.get(id)?.name).filter((name):name is string=>!!name).slice(0,4);
  const purpose=current?skillById.get(current.skillId)?.name:null;
  const title=game?.title??(session.discovery?"Meet Nova":session.teamId?"Garden Rescue Team":chapter?.title??worldName(session.subject));
  return <div className={`play-overlay ${game?`game-player game-${game.id}`:""}`} role="dialog" aria-modal="true" aria-label={title}>
    <header className="play-header"><button className="text-button" disabled={busy} onClick={onBack}><ArrowLeft size={20}/>{game?'Back to games':'Save & take a break'}</button><span className="play-world">{game?.emoji} {title}</span><span className="star-pill"><Star size={16}/>{profile.stars} stars</span></header>
    {error&&<div className="error" role="alert">{error}<button disabled={busy} onClick={onBack}>Return to my adventure</button></div>}
    {current?<div className="activity"><div className="activity-progress"><span>Discovery {Math.min(session.index+(feedback?.correct?0:1),session.total)} of {session.total}</span><div>{Array.from({length:session.total},(_,i)=><span key={i} className={i<session.index?"done":""}/>)}</div></div>
      {game&&<div className="game-mission-label">{game.missions[session.gameLevel??0]}</div>}
      {current.passage&&<StoryPage passage={current.passage}/>}
      <div className="activity-category">{worldName(current.subject)}</div>{purpose&&<div className="skill-purpose"><Lightbulb size={16}/><span>We are practising:</span> {purpose}</div>}<h1>{current.prompt}</h1>
      <button className="read-button" onClick={()=>readAloud(activityNarration(current))}><Volume2 size={20}/>Read it to me</button>
      <ActivityEngineView key={session.id+current.id} question={current} busy={busy} correct={!!feedback?.correct} selected={selected} onAnswer={onAnswer} onHint={onHint}/>
      <div className={`feedback ${feedback?.correct?"positive":""}`} aria-live="polite"><span className="fox">🦊</span><div><strong>{feedback?.correct?"You figured it out!":"Nova is here to help"}</strong><p>{feedback?.message||feedback?.hint||"Take your time. You can try, think, and try again."}</p>{feedback?.hint&&feedback.message&&<p>{feedback.hint}</p>}</div></div>
      {feedback?.correct&&<div className="reflection-prompt"><p>What helped you? <small>You can tell a grown-up, too.</small></p>{[["counted","I counted"],["clue","I found a clue"],["pattern","I saw a pattern"],["tried","I tried another way"]].map(([strategy,label])=><button key={strategy} disabled={busy} aria-pressed={profile.reflections.some(r=>r.sessionId===session.id&&r.questionId===current.id&&r.strategy===strategy)} onClick={()=>onReflect(strategy)}>{label}</button>)}</div>}
      <div className="activity-actions">{feedback?.correct?<button className="primary" disabled={busy} onClick={onNext}>{session.index===session.total?"Finish my quest":"Next discovery"}<ArrowRight size={20}/></button>:<button className="text-button" disabled={busy} onClick={onHint}><Lightbulb size={19}/>Give me a hint</button>}</div>
    </div>:<div className="completion"><span className="celebration">{game?<span className="game-completion-icon">{game.emoji}</span>:<Trophy size={65}/>}</span><div className="eyebrow">LOOK WHAT YOU DID</div><h1>{game?"Mission":"Quest"} complete, {profile.name}!</h1>
      <p>{game?`${game.missions[session.gameLevel??0]} is in your playground passport. You planned, practiced, and made a discovery.`:chapter?.ending??"You thought, tried, and kept exploring. That’s how your brain grows."}</p>
      {chapter&&<p className="chapter-unlock">🌱 Discovered: {chapter.unlock}</p>}
      {practicedSkills.length>0&&<><p className="completion-skills-label">You practised these skills:</p><div className="completion-skills">{practicedSkills.map(name=><span key={name}>{name}</span>)}</div></>}
      <span className="big-reward"><Star fill="currentColor"/>+{session.total*2} stars</span>
      <div className="quest-feelings"><p>How did that feel?</p>{[["easy","😄","Easy"],["right","🙂","Just right"],["tricky","🤔","Tricky"]].map(([value,emoji,label])=><button key={value} disabled={busy} aria-pressed={profile.adventure.feelings.some(f=>f.sessionId===session.id&&f.value===value)} onClick={()=>onFeeling(value)}><span>{emoji}</span>{label}</button>)}</div>
      <p className="break-note">Now is a lovely time to stretch or share a discovery with a grown-up.</p><button className="primary" disabled={busy} onClick={onFinish}>{game?"Back to the Game Zone":session.teamId?"Back to our team":chapter?"Visit my garden":"Back to my adventure"}<ArrowRight size={19}/></button>
    </div>}
  </div>;
}
