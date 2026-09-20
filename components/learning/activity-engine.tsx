"use client";

import { useState } from "react";
import { Check, RotateCcw, Volume2 } from "lucide-react";
import type { ActivityEngine, PublicQuestion } from "@/lib/activity-types";
import { TenFrame, RobotRoute, Matching, Ordering } from "./arcade-engines";
import { BubblePop, BalanceScale, Constellation } from "./play-engines";
import { readAloud } from "@/lib/speech";

type Props = {
  question: PublicQuestion;
  busy: boolean;
  correct: boolean;
  selected: string;
  onAnswer: (value: string) => void;
  onHint: () => Promise<unknown>;
};

export function ActivityEngineView(props: Props) {
  const engine = props.question.engine;
  if (engine?.kind === "ten-frame") return <TenFrame {...props} engine={engine}/>;
  if (engine?.kind === "route") return <RobotRoute {...props} engine={engine}/>;
  if (engine?.kind === "matching") return <Matching {...props} engine={engine}/>;
  if (engine?.kind === "ordering") return <Ordering {...props} engine={engine}/>;
  if (engine?.kind === "counting") return <Counting {...props} engine={engine}/>;
  if (engine?.kind === "sorting") return <Sorting {...props} engine={engine}/>;
  if (engine?.kind === "memory") return <Memory {...props} engine={engine}/>;
  if (engine?.kind === "word-builder") return <WordBuilder {...props} engine={engine}/>;
  if (engine?.kind === "bubble-pop") return <BubblePop {...props} engine={engine}/>;
  if (engine?.kind === "balance") return <BalanceScale {...props} engine={engine}/>;
  if (engine?.kind === "constellation") return <Constellation {...props} engine={engine}/>;
  return <div className="engine-stage">
    {engine?.kind === "pattern"
      ? <div className="pattern-stones" aria-label="Pattern to complete">{engine.sequence.map((item, i)=><span key={i}>{item}</span>)}<span className="missing-stone">?</span></div>
      : props.question.visual && <div className="activity-visual">{props.question.visual}</div>}
    <div className="answers">{props.question.options.map(option=><button key={option} disabled={props.busy||props.correct}
      className={props.selected===option ? props.correct ? "correct" : "chosen" : ""}
      onClick={()=>props.onAnswer(option)}>{option}{props.selected===option&&props.correct&&<Check size={24}/>}</button>)}</div>
  </div>;
}

function Counting({engine,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"counting"}>}) {
  const [touched,setTouched]=useState<number[]>([]);
  const [amount,setAmount]=useState(0);
  return <fieldset className="engine-stage" disabled={busy||correct}>
    <legend className="engine-instruction">Touch each object once. Then tell Nova how many.</legend>
    <div className="counting-meadow">{engine.objects.map((object,index)=><button type="button" key={index}
      className={touched.includes(index)?"counted":""} aria-label={`Object ${index+1}, ${touched.includes(index)?"counted":"not counted"}`}
      aria-pressed={touched.includes(index)} onClick={()=>setTouched(items=>items.includes(index)?items.filter(i=>i!==index):[...items,index])}>
      <span aria-hidden="true">{object}</span>{touched.includes(index)&&<small>{touched.indexOf(index)+1}</small>}
    </button>)}</div>
    <div className="number-controls"><button type="button" aria-label="One fewer" disabled={amount===0} onClick={()=>setAmount(n=>n-1)}>−</button>
      <output aria-live="polite" aria-label="My count">{amount}</output>
      <button type="button" aria-label="One more" disabled={amount===engine.max} onClick={()=>setAmount(n=>n+1)}>+</button></div>
    <button type="button" className="primary" onClick={()=>onAnswer(String(amount))}>Pack {amount} <Check size={20}/></button>
  </fieldset>;
}

function Sorting({engine,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"sorting"}>}) {
  const [assignments,setAssignments]=useState<Record<string,string>>({});
  const [picked,setPicked]=useState<string|null>(null);
  function place(item:string|null,bin:string) {
    if(!item||busy||correct||!engine.items.some(i=>i.id===item)) return;
    setAssignments(a=>({...a,[item]:bin}));setPicked(null);
  }
  return <fieldset className="engine-stage" disabled={busy||correct}>
    <legend className="engine-instruction">Choose an object, then its basket. You can also drag it.</legend>
    <div className="sort-tray">{engine.items.map(item=><button type="button" key={item.id} draggable={!busy&&!correct}
      onDragStart={event=>{event.dataTransfer.setData("text/plain",item.id);setPicked(item.id);}}
      aria-pressed={picked===item.id} onClick={()=>setPicked(item.id)} className={picked===item.id?"picked":""}>
      <span aria-hidden="true">{item.emoji}</span><strong>{item.label}</strong><small>{engine.bins.find(b=>b.id===assignments[item.id])?.label??"Choose a basket"}</small>
    </button>)}</div>
    <div className="sorting-baskets">{engine.bins.map(bin=><button type="button" key={bin.id}
      onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();place(e.dataTransfer.getData("text/plain"),bin.id);}}
      onClick={()=>place(picked,bin.id)} aria-label={`Place selected object in ${bin.label}`}>
      <span aria-hidden="true">{bin.emoji}</span><strong>{bin.label}</strong>
      <div>{engine.items.filter(i=>assignments[i.id]===bin.id).map(i=><span key={i.id} aria-label={i.label}>{i.emoji}</span>)}</div>
    </button>)}</div>
    <button type="button" className="primary" disabled={Object.keys(assignments).length!==engine.items.length}
      onClick={()=>onAnswer(JSON.stringify(assignments))}>Check my baskets <Check size={20}/></button>
  </fieldset>;
}

function Memory({engine,busy,correct,onAnswer,onHint}: Props & {engine: Extract<ActivityEngine,{kind:"memory"}>}) {
  const [show,setShow]=useState(true);
  const [sequence,setSequence]=useState<string[]>([]);
  return <fieldset className="engine-stage" disabled={busy||correct}>
    <legend className="engine-instruction">{show?"Take your time. Remember the order.":"What came first? Build the same sequence."}</legend>
    <div className="memory-sequence" aria-label={show?"Sequence to remember":"Your remembered sequence"}>
      {engine.sequence.map((item,i)=><span key={i}>{show?item:sequence[i]??"?"}</span>)}
    </div>
    {show?<button type="button" className="primary" onClick={()=>{setShow(false);setSequence([]);}}>I’m ready — hide them</button>
      :<><div className="memory-choices">{engine.choices.map(item=><button type="button" key={item}
        disabled={sequence.length===engine.sequence.length} onClick={()=>setSequence(s=>[...s,item])}>{item}</button>)}</div>
        <div className="engine-tools"><button type="button" className="text-button" onClick={()=>setSequence([])}><RotateCcw size={18}/> Try my order again</button>
        <button type="button" className="text-button" onClick={async()=>{if(await onHint())setShow(true);}}>Show me again (a hint)</button></div>
        <button type="button" className="primary" disabled={sequence.length!==engine.sequence.length} onClick={()=>onAnswer(JSON.stringify(sequence))}>Deliver the supplies <Check size={20}/></button></>}
  </fieldset>;
}

function WordBuilder({engine,question,busy,correct,onAnswer}: Props & {engine: Extract<ActivityEngine,{kind:"word-builder"}>}) {
  const [slots,setSlots]=useState<number[]>([]);
  return <fieldset className="engine-stage" disabled={busy||correct}>
    <legend className="engine-instruction">Choose letters from the tray. Tap a placed letter to put it back.</legend>
    <div className="word-picture" aria-hidden="true">{question.visual}</div>
    {question.audioLabel&&<button type="button" className="read-button" onClick={()=>readAloud(`The word is ${question.audioLabel}. ${question.audioLabel}.`)}><Volume2 size={20}/>Listen to the word</button>}
    <div className="letter-slots">{Array.from({length:engine.length},(_,i)=><button type="button" key={i}
      aria-label={slots[i]===undefined?`Empty letter slot ${i+1}`:`Remove letter ${engine.letters[slots[i]]}`}
      onClick={()=>setSlots(s=>s.filter((_,j)=>j!==i))}>{slots[i]===undefined?"·":engine.letters[slots[i]]}</button>)}</div>
    <div className="letter-tray">{engine.letters.map((letter,i)=><button type="button" key={i}
      disabled={slots.includes(i)||slots.length===engine.length} onClick={()=>setSlots(s=>[...s,i])}>{letter}</button>)}</div>
    <button type="button" className="primary" disabled={slots.length!==engine.length} onClick={()=>onAnswer(slots.map(i=>engine.letters[i]).join(""))}>Read my word <Check size={20}/></button>
  </fieldset>;
}
