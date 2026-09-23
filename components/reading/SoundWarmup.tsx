'use client';
import {useState} from 'react';
import {ArrowRight} from 'lucide-react';
import type {ReadingSkill} from '@/lib/reading/types';
import {AudioButton} from './AudioButton';

/**
 * A two-minute sound warm-up before the lesson.
 *
 * Co-play phonics programmes open every lesson by running through the sounds already
 * learned (Reading.com does it with an alphabet song). The learning-science reason is
 * retrieval practice and cumulative review: a sound recalled at the start of today's
 * lesson is a sound that stays, and it primes the letters the lesson is about to blend.
 *
 * One letter at a time, because four-year-olds read one thing at a time. The child says
 * the sound first and only then taps to hear it — recall before feedback, not after.
 * Nothing here is scored: it is a warm-up, and the server's evidence comes from the
 * activities that follow.
 */
export function SoundWarmup({skills,onDone}:{skills:ReadingSkill[];onDone:()=>void}){
  const [index,setIndex]=useState(0),[checked,setChecked]=useState(false);
  const skill=skills[index];
  if(!skill)return null;
  const last=index===skills.length-1;
  return (
    <div className="sound-warmup">
      <h2>Sound warm-up</h2>
      <p className="sound-warmup-count" aria-live="polite">{index+1} of {skills.length}</p>
      <div className="letter-monument" aria-label={`Letter ${skill.letter}`}>
        <span>{skill.letter?.toUpperCase()}</span><strong>{skill.letter}</strong>
      </div>
      <p className="sound-caption">{checked?<>{skill.phoneme} · like <strong>{skill.example}</strong></>:'What sound does it make? Say it out loud!'}</p>
      <div className="sound-warmup-actions" onClickCapture={()=>setChecked(true)}>
        <AudioButton kind="phoneme" audioKey={skill.id} text={skill.phoneme??''} cue={skill.cue} example={skill.example} src={skill.audioSrc} label="Check my sound"/>
      </div>
      <div className="sound-warmup-nav">
        <button className="text-button" onClick={onDone}>Skip warm-up</button>
        <button className="primary" onClick={()=>{if(last)onDone();else{setIndex(index+1);setChecked(false);}}}>
          {last?'Start the lesson':'Next sound'}<ArrowRight size={20}/>
        </button>
      </div>
    </div>
  );
}
