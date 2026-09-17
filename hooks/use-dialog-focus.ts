"use client";
import { useEffect } from "react";

export function useDialogFocus(open:boolean,onClose:()=>void) {
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
    if(!dialog)return;
    const getTargets=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]'))
      .filter(item=>item.getClientRects().length>0);
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    getTargets()[0]?.focus();
    const listener=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();onClose();}
      if(event.key!=="Tab")return;
      const targets=getTargets();const first=targets[0],last=targets.at(-1);
      if(!first)return;
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
    };
    document.addEventListener("keydown",listener);
    return()=>{document.removeEventListener("keydown",listener);document.body.style.overflow=oldOverflow;previous?.focus();};
  },[open,onClose]);
}
