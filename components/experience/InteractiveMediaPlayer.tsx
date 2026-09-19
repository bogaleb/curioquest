'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useDialogFocus} from '@/hooks/use-dialog-focus';
import {Play,Pause,Volume2,Maximize,RefreshCw} from 'lucide-react';
import type {MediaAsset,MediaCue} from '@/lib/experience/types';
import {NovaCharacter} from '@/components/characters/NovaCharacter';
import {readAloud} from '@/lib/speech';
import {audioSettings,duckMusic} from '@/lib/audio';
export function InteractiveMediaPlayer({media,scene,time,cue,busy,onTick,onNext,children}:{media:MediaAsset;scene:number;time:number;cue:Omit<MediaCue,'answer'>|null;busy:boolean;onTick:(time:number)=>void;onNext:()=>void;children:React.ReactNode}){
 const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false),[captions,setCaptions]=useState(true),[focus,setFocus]=useState(false),video=useRef<HTMLVideoElement>(null),root=useRef<HTMLDivElement>(null);
 useDialogFocus(focus,useCallback(()=>setFocus(false),[]));
 const tick=useRef(onTick);useEffect(()=>{tick.current=onTick;},[onTick]);
 const current=media.scenes[scene],finished=time>=current.duration;
 useEffect(()=>{if(!playing||cue||busy||finished||media.videoUrl&&!failed)return;const timer=setInterval(()=>{if(!document.hidden)tick.current(time+1);},1000);return()=>clearInterval(timer);},[playing,cue,busy,finished,time,media.videoUrl,failed]);
 useEffect(()=>{const stop=()=>{if(document.hidden){setPlaying(false);video.current?.pause();}};document.addEventListener('visibilitychange',stop);return()=>{document.removeEventListener('visibilitychange',stop);duckMusic(false);};},[]);
 useEffect(()=>{if(cue||busy||finished)video.current?.pause();else if(playing&&video.current)void video.current.play().catch(()=>setFailed(true));duckMusic(playing&&!cue&&!finished);},[cue,busy,playing,finished]);
 function toggle(){const next=!playing;setPlaying(next);duckMusic(next);if(!next)video.current?.pause();}
 const offset=media.scenes.slice(0,scene).reduce((n,s)=>n+s.duration,0);
 return <div ref={root} role={focus?'dialog':undefined} aria-modal={focus||undefined} aria-label={focus?'Interactive story focus view':undefined} className={`interactive-media ${focus?'media-focus':''}`}>
 <header className="media-heading"><div><span className="eyebrow">CURIOQUEST ORIGINAL · INTERACTIVE STORY</span><h2>{media.title}</h2></div><button className="secondary" onClick={()=>setFocus(v=>!v)}><Maximize size={18}/>{focus?'Exit focus':'Focus view'}</button></header>
 {media.videoUrl&&!failed?<video ref={video} src={media.videoUrl} preload="metadata" playsInline controls={false} muted={!audioSettings().narration} onLoadedMetadata={()=>{if(video.current){video.current.currentTime=offset+time;video.current.volume=audioSettings().voiceVolume;}}} onTimeUpdate={()=>{const next=Math.floor((video.current?.currentTime??offset)-offset);if(next>time&&!busy)onTick(next);}} onSeeking={()=>{if(video.current&&video.current.currentTime>offset+time+1)video.current.currentTime=offset+time;}} onError={()=>setFailed(true)}>{media.captionUrl&&<track kind="captions" src={media.captionUrl} srcLang="en" label="English" default/>}</video>:<div className={`episode-scene setting-${current.setting} ${playing&&!cue?'scene-playing':''}`}><div className="episode-sun"/><div className="episode-cloud cloud-one"/><div className="episode-cloud cloud-two"/><div className="episode-hill"/><div className="episode-tree tree-one"/><div className="episode-tree tree-two"/><NovaCharacter state={cue?'listen':playing?current.nova:'idle'} size="large"/>{current.letters&&<div className="episode-letters">{current.letters.split(' ').map((l,i)=><span key={i}>{l}</span>)}</div>}{current.setting==='garden'&&<div className="episode-garden" aria-hidden="true">✿ ✿ ✿</div>}</div>}
 {failed&&<p role="status" className="media-fallback">The video could not load. Your original animated story is still ready.<button className="text-button" onClick={()=>setFailed(false)}><RefreshCw size={15}/>Retry video</button></p>}
 {!media.videoUrl&&<p className="prototype-caption">Original animated story · final filmed animation can be added later</p>}
 {captions&&<p className="caption-layer" aria-live="polite">{current.caption}</p>}
 <div className="media-controls"><button className="primary" disabled={busy||!!cue||finished} onClick={toggle}>{playing?<Pause size={20}/>:<Play size={20}/>} {playing?'Pause':'Play scene'}</button><button className="secondary" onClick={()=>readAloud(current.caption)}><Volume2 size={19}/>Read scene</button><button className="text-button" aria-pressed={captions} onClick={()=>setCaptions(v=>!v)}>{captions?'Hide captions':'Show captions'}</button><span>Scene {scene+1} / {media.scenes.length}</span></div>
 <div className="media-time" role="progressbar" aria-label="Current scene" aria-valuemin={0} aria-valuemax={current.duration} aria-valuenow={time}><span style={{width:`${time/current.duration*100}%`}}/></div>
 {cue?<div className="media-interaction"><span className="eyebrow">YOUR TURN · STORY PAUSED</span>{children}</div>:finished?<button className="primary media-next" disabled={busy} onClick={()=>{setPlaying(false);onNext();}}>{scene===media.scenes.length-1?'Open my discovery':'Next scene →'}</button>:<p className="media-prompt">{playing?'Look, listen, and get ready to help.':'Press play when you are ready. You can pause any time.'}</p>}
 </div>;
}
