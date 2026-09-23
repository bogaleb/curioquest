'use client';
import {useRef,useState} from 'react';
import {ArrowRight,RotateCcw} from 'lucide-react';
import type {LearningBandId} from '@/lib/learning-bands';
import {tierForBand} from '@/lib/science/tier';
import {characterByKey,writingLines} from '@/lib/studio/writing';
import {checkTrace,traceAdvice} from '@/lib/studio/studio';
import type {StrokePoint} from '@/lib/studio/types';
import {AudioButton} from './AudioButton';

/**
 * Write the new letter. The writing step of a co-play phonics lesson.
 *
 * Letter formation sits beside the sound it spells: saying /m/ while writing m ties the
 * sound, the shape and the movement together, which is why programmes like Reading.com
 * write the letter in the same lesson that teaches it.
 *
 * Gradual release in two passes. First the grey trail, the green start dot and the cue for
 * each stroke. Then the same letter with only a faint trail — the guide is taken away once
 * the movement is in the hand. Each stroke is checked for start, direction and staying
 * near the line (`checkTrace`), never for neatness, and the tolerance follows the band.
 *
 * Practice only: nothing here is sent to the server.
 */
const toPath=(points:StrokePoint[])=>points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');

export function LetterTrace({letter,band,onDone}:{letter:string;band:LearningBandId;onDone:()=>void}){
  const character=characterByKey('lowercase',letter);
  const tier=tierForBand(band);
  const [pass,setPass]=useState(0),[stroke,setStroke]=useState(0),[drawn,setDrawn]=useState<StrokePoint[][]>([]),[live,setLive]=useState<StrokePoint[]>([]),[advice,setAdvice]=useState('');
  const box=useRef<SVGSVGElement>(null),drawing=useRef(false);
  if(!character)return null;
  const strokes=character.strokes,finished=stroke>=strokes.length,current=strokes[Math.min(stroke,strokes.length-1)];
  const faint=pass===1;

  function at(e:React.PointerEvent<SVGSVGElement>):StrokePoint{
    const r=box.current!.getBoundingClientRect();
    return [Math.round((e.clientX-r.left)*1000/r.width)/10,Math.round((e.clientY-r.top)*1000/r.height)/10];
  }
  function end(){
    if(!drawing.current)return;drawing.current=false;
    const result=checkTrace(current,live,tier);
    setAdvice(traceAdvice(result,current));
    if(result.ok){setDrawn(d=>[...d,live]);setStroke(s=>s+1);}
    setLive([]);
  }
  function again(nextPass:number){setPass(nextPass);setStroke(0);setDrawn([]);setLive([]);setAdvice('');}

  const {ascender,midline,baseline,descender}=writingLines;
  return (
    <div className="letter-trace">
      <h2>{faint?`Now write ${letter} with a lighter trail`:`Write ${letter}`}</h2>
      <p className="letter-trace-cue" aria-live="polite">{finished?`You wrote ${letter}! Say its sound as you look at it: ${character.example??''}`:current.cue}</p>
      {!finished&&<AudioButton text={current.cue} label="Hear how"/>}
      <svg ref={box} className="letter-trace-paper" viewBox="0 0 100 100" role="img"
        aria-label={`Writing paper for little ${letter}. Start on the green dot and follow the trail.`}
        onPointerDown={e=>{if(finished)return;e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;setLive([at(e)]);}}
        onPointerMove={e=>{if(drawing.current){const p=at(e);setLive(l=>l.length<400?[...l,p]:l);}}}
        onPointerUp={end} onPointerCancel={end}>
        <line className="trace-rule" x1="2" x2="98" y1={ascender} y2={ascender}/>
        <line className="trace-rule trace-rule-mid" x1="2" x2="98" y1={midline} y2={midline}/>
        <line className="trace-rule trace-rule-base" x1="2" x2="98" y1={baseline} y2={baseline}/>
        <line className="trace-rule" x1="2" x2="98" y1={descender} y2={descender}/>
        {strokes.map((s,i)=><path key={i} className="trace-trail" data-faint={faint||undefined} data-done={i<stroke||undefined} d={toPath(s.points)}/>)}
        {drawn.map((points,i)=><path key={i} className="trace-ink" d={toPath(points)}/>)}
        {live.length>0&&<path className="trace-ink" d={toPath(live)}/>}
        {!finished&&<circle className="trace-start" cx={current.points[0][0]} cy={current.points[0][1]} r="3.2"/>}
      </svg>
      {advice&&!finished&&<p className="letter-trace-advice" role="status">{advice}</p>}
      <div className="sound-warmup-nav">
        {!finished&&<button className="text-button" onClick={()=>again(pass)}><RotateCcw size={16}/>Start again</button>}
        <button className="text-button" onClick={onDone}>Skip writing</button>
        {finished&&(pass===0
          ?<button className="primary" onClick={()=>again(1)}>Write it again<ArrowRight size={20}/></button>
          :<button className="primary" onClick={onDone}>Keep going<ArrowRight size={20}/></button>)}
      </div>
    </div>
  );
}
