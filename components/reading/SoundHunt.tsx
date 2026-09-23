'use client';
import {useMemo,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import type {ReadingLetter,ReadingSkill} from '@/lib/reading/types';
import {huntRounds} from '@/lib/reading/sound-hunt';
import {speak} from '@/lib/speech';

/**
 * Which picture starts with the new sound? Listening practice straight after a new letter.
 *
 * A tap says the word aloud — whole words only, never a synthesised phoneme — and chooses
 * it. A wrong pick is answered with the word stretched in print so a grown-up can say it,
 * and the child simply tries another: this is practice, it is not sent to the server, and
 * it cannot be failed.
 */
export function SoundHunt({skill,seed,onDone}:{skill:ReadingSkill;seed:number;onDone:()=>void}){
  const letter=skill.letter as ReadingLetter;
  const rounds=useMemo(()=>huntRounds(letter,seed,2,skill.example),[letter,seed,skill.example]);
  const [round,setRound]=useState(0),[tried,setTried]=useState<string[]>([]),[found,setFound]=useState(false);
  const current=rounds[round];
  if(!current)return null;
  const last=round===rounds.length-1;
  return (
    <div className="sound-hunt">
      <h2>Sound hunt</h2>
      <p>Which one starts with <strong>{skill.phoneme}</strong>, like <strong>{skill.example}</strong>?</p>
      <div className="sound-hunt-choices" role="group" aria-label="Pictures">
        {current.choices.map(choice=>{
          const right=choice.word===current.answer,picked=tried.includes(choice.word);
          return (
            <button key={choice.word} type="button" data-state={picked?(right?'right':'wrong'):undefined} disabled={found||picked}
              aria-label={choice.word}
              onClick={()=>{speak(choice.word);setTried(t=>[...t,choice.word]);if(right)setFound(true);}}>
              <span className="sound-hunt-picture" aria-hidden="true">{choice.emoji}</span>
              <span className="sound-hunt-word">{choice.word}</span>
            </button>
          );
        })}
      </div>
      <p className="sound-hunt-feedback" role="status">
        {found?`Yes! ${current.answer} starts with ${skill.phoneme}.`:tried.length?`Listen again: does it start with ${skill.phoneme}? Try another one.`:'Tap a picture to hear it.'}
      </p>
      <div className="sound-warmup-nav">
        <button className="text-button" onClick={onDone}>Skip</button>
        {found&&<button className="primary" onClick={()=>{if(last)onDone();else{setRound(round+1);setTried([]);setFound(false);}}}>{last?'Next':'Another one'}<ArrowRight size={20}/></button>}
      </div>
    </div>
  );
}
