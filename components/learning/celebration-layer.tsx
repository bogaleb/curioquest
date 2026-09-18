'use client';
import {useEffect,useState} from 'react';
// Decorative only. It never delays navigation, captures taps, or creates a reward loop.
export function CelebrationLayer(){
  const [burst,setBurst]=useState<{key:number;style:string}|null>(null);
  useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const listener=(event:Event)=>{const style=(event as CustomEvent<{style:string}>).detail.style;if(style==='minimal'||style==='silent')return;setBurst(previous=>({key:(previous?.key??0)+1,style}));clearTimeout(timer);timer=setTimeout(()=>setBurst(null),2400);};window.addEventListener('curio-celebration',listener);return()=>{clearTimeout(timer);window.removeEventListener('curio-celebration',listener);};},[]);
  if(!burst)return null;
  return <div key={burst.key} className={`celebration-layer celebration-${burst.style}`} aria-hidden="true">{Array.from({length:burst.style==='energetic'?18:burst.style==='cheerful'?12:6},(_,i)=><span key={i} style={{left:`${8+(i*17)%85}%`,animationDelay:`${i%5*.08}s`,'--drift':`${i%2?55:-55}px`} as React.CSSProperties}>{i%3===0?'✦':i%3===1?'★':'●'}</span>)}</div>;
}
