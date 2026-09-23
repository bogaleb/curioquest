'use client';
import {Heart} from 'lucide-react';
import type {ReadingStory,ReadingWord} from '@/lib/reading/types';
import {speak} from '@/lib/speech';
import {AudioButton} from './AudioButton';

/**
 * Reading a decodable book together.
 *
 * Three habits from co-play phonics programmes (Reading.com and its peers) live here:
 *
 *   - Heart words. A word that does not sound out ("the", "said") is marked with a heart —
 *     the widely used "know it by heart" convention — so a child is never told to sound
 *     out a word that cannot be sounded out, and a grown-up knows which ones to just say.
 *   - Tap to hear. A word the child is stuck on is read to them whole, never as synthesised
 *     phonemes (see `lib/audio-policy.ts`), and the tap still counts as help, so the
 *     evidence the server records stays honest.
 *   - The picture comes after the words. A picture beside the sentence invites guessing
 *     from it; the story's picture appears with the question, once the page is read.
 */
export function DecodableReader({story,page,busy,words=[],onPage,onAnswer,onHelp}:{story:Omit<ReadingStory,'answer'>;page:number;busy:boolean;words?:ReadingWord[];onPage:()=>void;onAnswer:(answer:string)=>void;onHelp:()=>void}){
  const text=story.pages[page];
  const heart=new Set(words.filter(w=>w.pattern==='tricky').map(w=>w.word.toLowerCase()));
  const isHeart=(token:string)=>heart.has(token.toLowerCase().replace(/[^a-z]/g,''));
  return <div className="decodable-reader"><h2>{story.title}</h2>{text?<>
    <p>Try the sounds first. A grown-up can listen.</p>
    <div className="decodable-page" aria-label={text}>{text.split(' ').map((token,i)=>{const hearted=isHeart(token);return <button key={i} disabled={busy} data-heart={hearted||undefined} aria-label={hearted?`Heart word ${token}. Tap to hear it.`:`Hear ${token}`} onClick={()=>{speak(token.replace(/[^A-Za-z']/g,''));onHelp();}}>{hearted&&<Heart className="heart-mark" size={14} aria-hidden fill="currentColor"/>}{token}</button>;})}</div>
    {heart.size>0&&text.split(' ').some(isHeart)&&<p className="reading-grownup-cue"><Heart size={14} aria-hidden fill="currentColor"/> Heart words don’t sound out. We know them by heart.</p>}
    <p className="reading-grownup-cue">A capital S has the same sound as s. Tap a word if you want help. We do not record or score your voice.</p>
    <span className="page-dots" aria-label={`Page ${page+1} of ${story.pages.length}`}>{story.pages.map((_,i)=><i key={i} className={i<=page?'visited':''}/>)}</span>
    <button className="primary" disabled={busy} onClick={onPage}>{page===story.pages.length-1?'Talk about our story':'I tried this page →'}</button>
  </>:<>
    <div className="story-meaning story-reveal" aria-hidden="true">{story.emoji}</div>
    <h3>{story.question}</h3>
    <AudioButton text={`${story.question} The choices are ${story.choices.join(' or ')}.`} label="Hear our story question"/>
    <div className="reading-word-choices">{story.choices.map(choice=><button disabled={busy} key={choice} onClick={()=>onAnswer(choice)}>{choice}</button>)}</div>
    <p className="reading-grownup-cue">This question checks understanding. Turning a page is practice, not proof of independent reading.</p>
  </>}</div>;
}
