'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {NovaState} from '@/lib/experience/types';
import {readAloud} from '@/lib/speech';
export function useNova(initial:NovaState='idle'){
 const [state,setState]=useState<NovaState>(initial),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const play=useCallback((next:NovaState)=>{if(timer.current)clearTimeout(timer.current);setState(next);if(next!=='idle')timer.current=setTimeout(()=>setState('idle'),next==='dance'?3200:2000);},[]);
 return {state,play,speak:(line:string)=>{play('explain');readAloud(line);},point:()=>play('point'),celebrate:()=>play('celebrate')};
}
// Original lightweight CSS puppet. A production rig can replace this renderer
// without changing the event/state contract or shipping a video on every page.
export function NovaCharacter({state='idle',size='normal'}:{state?:NovaState;size?:'small'|'normal'|'large'}){
 return <div className={`nova-character nova-${size}`} data-state={state} role="img" aria-label={`Nova the fox, ${state}`}><div className="nova-shadow"/><div className="nova-tail"/><div className="nova-body"><div className="nova-belly"/><div className="nova-scarf"/></div><div className="nova-arm left"/><div className="nova-arm right"/><div className="nova-head"><div className="nova-ear left"/><div className="nova-ear right"/><div className="nova-face"><div className="nova-cheek left"/><div className="nova-cheek right"/><div className="nova-eye left"/><div className="nova-eye right"/><div className="nova-nose"/><div className="nova-mouth"/></div></div><div className="nova-foot left"/><div className="nova-foot right"/>{state==='celebrate'&&<span className="nova-sparkle" aria-hidden="true">✦</span>}</div>;
}
