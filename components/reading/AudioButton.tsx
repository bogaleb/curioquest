'use client';
import {useEffect,useRef,useState} from 'react';
import {Volume2} from 'lucide-react';
import {audioSettings} from '@/lib/audio';
export function AudioButton({text,src,label='Listen',slow=false}:{text:string;src?:string;label?:string;slow?:boolean}){
  const sound=useRef<HTMLAudioElement|null>(null),[status,setStatus]=useState('');
  useEffect(()=>()=>{sound.current?.pause();window.speechSynthesis?.cancel();},[]);
  async function play(){sound.current?.pause();window.speechSynthesis?.cancel();const settings=audioSettings();if(!settings.narration){setStatus('Voice is off. Read together, or ask your grown-up to turn it on.');return;}setStatus('');
    try{if(src){sound.current=new Audio(src);sound.current.volume=settings.voiceVolume;sound.current.playbackRate=slow?.8:1;await sound.current.play();}else if('speechSynthesis' in window){const speech=new SpeechSynthesisUtterance(text);speech.lang='en-US';speech.rate=slow?.65:.85;speech.volume=settings.voiceVolume;speech.onerror=()=>setStatus('Let’s read together. This device could not play the voice.');window.speechSynthesis.speak(speech);}else setStatus('Let’s read together. This device has no spoken voice.');}catch{setStatus('Audio is unavailable. Read this with your grown-up.');}}
  return <span className="reading-audio"><button type="button" className="secondary" onClick={play}><Volume2 size={21}/>{label}</button>{status&&<small role="status">{status}</small>}</span>;
}
