"use client";
import { useState } from "react";
import { Check, Play, RotateCcw, Undo2, Volume2 } from "lucide-react";
import type { ActivityEngine, PublicQuestion } from "@/lib/activity-types";
import { traceRoute, routeDirections } from "@/lib/route-engine";
import { readAloud } from "@/lib/speech";

type Props = { question: PublicQuestion; busy: boolean; correct: boolean; onAnswer: (answer: string) => void };

export function StoryPage({ passage }: {passage: NonNullable<PublicQuestion["passage"]>}) {
  return <section className="story-book" aria-label={passage.title}>
    <div className="story-book-art" aria-hidden="true">{passage.emoji}<span>✦</span></div>
    <div><h2>{passage.title}</h2><p>{passage.text}</p>
      <button className="text-button" onClick={()=>readAloud(`${passage.title}. ${passage.text}`)}><Volume2 size={19}/>Listen to the story</button></div>
  </section>;
}

export function TenFrame({engine,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"ten-frame"}>}) {
  const [filled,setFilled]=useState<number[]>([]);
  return <fieldset className="engine-stage kitchen-engine" disabled={busy||correct}>
    <legend className="engine-instruction">Tap a space to add a snack. Tap a snack to take it away.</legend>
    <div className="kitchen-trays">{Array.from({length:engine.size/10},(_,tray)=><div className="ten-frame" key={tray}>
      {Array.from({length:10},(_,slot)=>{const i=tray*10+slot;return <button type="button" key={i} aria-pressed={filled.includes(i)} aria-label={`Tray ${tray+1}, space ${slot+1}, ${filled.includes(i)?"filled":"empty"}`}
        onClick={()=>setFilled(list=>list.includes(i)?list.filter(n=>n!==i):[...list,i])}><span aria-hidden="true">{filled.includes(i)?engine.emoji:"·"}</span></button>;})}</div>)}</div>
    <div className="tray-count" aria-live="polite"><strong>{filled.length}</strong> ready to share</div>
    <button type="button" className="primary" onClick={()=>onAnswer(String(filled.length))}>Serve my tray <Check size={19}/></button>
  </fieldset>;
}

export function RobotRoute({engine,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"route"}>}) {
  const [moves,setMoves]=useState<string[]>([]),[ran,setRan]=useState(false);
  const result=traceRoute(engine,moves),position=ran?result.trail[result.trail.length-1]:engine.start;
  function undo(){setMoves(m=>m.slice(0,-1));setRan(false);}
  return <fieldset className="engine-stage robot-engine" disabled={busy||correct}>
    <legend className="engine-instruction">Choose arrows to build a plan. Each arrow moves one square.</legend>
    <div className="robot-layout"><div className="robot-map" style={{gridTemplateColumns:`repeat(${engine.size},1fr)`}} role="group" aria-label="Robot map">
      {Array.from({length:engine.size**2},(_,i)=><div key={i} className={`robot-cell ${engine.rocks.includes(i)?"rock":ran&&result.trail.includes(i)?"visited":""}`}
        aria-label={`Row ${Math.floor(i/engine.size)+1}, column ${i%engine.size+1}: ${i===position?"robot":i===engine.goal?"star":engine.rocks.includes(i)?"rock":"open"}`}>
        <span aria-hidden="true">{i===position?"🤖":i===engine.goal?"⭐":engine.rocks.includes(i)?"🪨":ran&&result.trail.includes(i)?"•":""}</span></div>)}
    </div><div className="robot-controller"><div className="direction-pad">{routeDirections.map(d=><button type="button" className={`move-${d.id}`} key={d.id} aria-label={`Add ${d.label.toLowerCase()} move`} disabled={moves.length>=engine.maxMoves}
      onClick={()=>{setMoves(m=>[...m,d.id]);setRan(false);}}>{d.symbol}<small>{d.label}</small></button>)}</div>
      <p>Up to {engine.maxMoves} moves. Rocks are resting spots we go around.</p></div></div>
    <div className="route-program" aria-label="Planned moves" aria-live="polite">{moves.length?moves.map((m,i)=><span key={i}>{routeDirections.find(d=>d.id===m)?.symbol}</span>):<small>Your plan goes here</small>}</div>
    {ran&&result.blocked&&<p role="status" className="route-feedback">A rock or the edge stopped the robot. Change the plan and try again.</p>}
    <div className="engine-tools"><button type="button" className="text-button" disabled={!moves.length} onClick={undo}><Undo2 size={18}/>Undo</button>
      <button type="button" className="text-button" disabled={!moves.length} onClick={()=>{setMoves([]);setRan(false);}}><RotateCcw size={18}/>Clear plan</button>
      <button type="button" className="primary" disabled={!moves.length} onClick={()=>{setRan(true);onAnswer(JSON.stringify(moves));}}><Play size={18}/>Run my plan</button></div>
  </fieldset>;
}

export function Matching({engine,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"matching"}>}) {
  const [picked,setPicked]=useState<string|null>(null),[pairs,setPairs]=useState<Record<string,string>>({});
  function match(target:string){if(!picked)return;setPairs(old=>({...Object.fromEntries(Object.entries(old).filter(([item,t])=>item!==picked&&t!==target)),[picked]:target}));setPicked(null);}
  return <fieldset className="engine-stage matching-engine" disabled={busy||correct}>
    <legend className="engine-instruction">Choose a card on the left, then its partner on the right. You can change a pair.</legend>
    <div className="matching-columns"><div>{engine.items.map(item=><button type="button" key={item.id} aria-pressed={picked===item.id} className={picked===item.id?"picked":pairs[item.id]?"paired":""} onClick={()=>setPicked(item.id)}>
      <strong>{item.label}</strong><small>{pairs[item.id]?`↔ ${engine.targets.find(t=>t.id===pairs[item.id])?.label}`:"Choose my partner"}</small></button>)}</div>
      <div>{engine.targets.map(target=><button type="button" key={target.id} disabled={!picked} onClick={()=>match(target.id)}><strong>{target.label}</strong><small>{Object.values(pairs).includes(target.id)?"Paired — can change":"Find my partner"}</small></button>)}</div></div>
    <button type="button" className="primary" disabled={Object.keys(pairs).length!==engine.items.length} onClick={()=>onAnswer(JSON.stringify(pairs))}>Check my pairs <Check size={19}/></button>
  </fieldset>;
}

export function Ordering({engine,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"ordering"}>}) {
  const [order,setOrder]=useState<string[]>([]);
  return <fieldset className="engine-stage ordering-engine" disabled={busy||correct}>
    <legend className="engine-instruction">Choose what happens first, then next. Tap a placed card to take it back.</legend>
    <ol className="ordered-path">{Array.from({length:engine.items.length},(_,i)=>{const item=engine.items.find(item=>item.id===order[i]);return <li key={i}>
      <span className="step-number">{i+1}</span><button type="button" disabled={!item} onClick={()=>setOrder(list=>list.filter((_,j)=>j!==i))} aria-label={item?`Remove step ${i+1}: ${item.label}`:`Step ${i+1}, empty`}>
        <span>{item?.emoji??"?"}</span><strong>{item?.label??(i===0?"First":"Then")}</strong></button></li>;})}</ol>
    <div className="story-step-tray">{engine.items.map(item=><button type="button" key={item.id} disabled={order.includes(item.id)} onClick={()=>setOrder(list=>[...list,item.id])}>
      <span aria-hidden="true">{item.emoji}</span>{item.label}</button>)}</div>
    <button type="button" className="primary" disabled={order.length!==engine.items.length} onClick={()=>onAnswer(JSON.stringify(order))}>Tell my story <Check size={19}/></button>
  </fieldset>;
}
