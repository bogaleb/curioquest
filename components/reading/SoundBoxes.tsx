'use client';
import {useState} from 'react';
import type {ReadingActivity,ReadingWord} from '@/lib/reading/types';
import {AudioButton} from './AudioButton';
export function SoundBoxes({activity,word,busy,onAnswer}:{activity:ReadingActivity;word:ReadingWord;busy:boolean;onAnswer:(answer:string)=>void}){
  const [tiles,setTiles]=useState<number[]>([]);
  function add(index:number){if(tiles.length<word.graphemes.length&&!tiles.includes(index))setTiles([...tiles,index]);}
  return <div className="sound-boxes"><span className="eyebrow">WORD WORKSHOP</span><h2>Hear it. Build it. Read it.</h2><p>One sound in each box. Tap a tile, then sweep the sounds together.</p><AudioButton text={`Build the word ${word.word}. ${word.word}.`} src={word.audioSrc} label="Hear my word"/><div className="phoneme-boxes" role="group" aria-label="Sound boxes">{word.graphemes.map((_,i)=><button key={i} disabled={busy} aria-label={tiles[i]===undefined?`Empty sound box ${i+1}`:`Remove ${activity.choices[tiles[i]]} from sound box ${i+1}`} onClick={()=>setTiles(tiles.filter((_,j)=>j!==i))}>{tiles[i]===undefined?<small>{i+1}</small>:activity.choices[tiles[i]]}</button>)}</div><div className="sound-sweep" aria-hidden="true">──────→</div><div className="letter-tiles" role="group" aria-label="Letter tiles">{activity.choices.map((letter,i)=><button key={i} disabled={busy||tiles.includes(i)} onClick={()=>add(i)} aria-label={`Use letter ${letter}`}>{letter}</button>)}</div><div className="studio-actions"><button className="secondary" disabled={busy||!tiles.length} onClick={()=>setTiles([])}>Start my word again</button><button className="primary" disabled={busy||tiles.length!==word.graphemes.length} onClick={()=>onAnswer(tiles.map(i=>activity.choices[i]).join(''))}>Check my word →</button></div></div>;
}
