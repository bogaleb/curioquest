'use client';
import type {ReadingActivity,ReadingSkill} from '@/lib/reading/types';
import {AudioButton} from './AudioButton';
import {ListenStation} from '@/components/kid/art/stations';

/**
 * Meet a letter, then catch it.
 *
 * Three things changed in WP-11 and none of them is the mechanic:
 *
 *   - the ALL-CAPS `LETTER VILLAGE` kicker is gone. §C5 bans a shouted eyebrow on a child
 *     surface, and the station already has a name on the grove path the child just walked.
 *   - the 👂 is a drawn listening hollow. An emoji is another artist's work in another
 *     style, it is sized by the platform font, and §G names it as the placeholder that
 *     ships forever. It had.
 *   - the catching step no longer prints its own instruction. Nova asks the question in
 *     her bubble now, and an `<h2>` repeating it in different words put two instructions
 *     in front of a four-year-old at once, over the band's on-screen word budget.
 *
 * The teaching step keeps its heading, because that moment is an introduction rather than
 * a question and Nova's line is not carrying it.
 */
export function LetterCatch({activity,skill,needsTeaching,busy,onTeach,onAnswer}:{activity:ReadingActivity;skill:ReadingSkill;needsTeaching:boolean;busy:boolean;onTeach:()=>void;onAnswer:(answer:string)=>void}){
  return <div className="letter-catch">{needsTeaching?<><h2>A little letter. A useful sound.</h2><div className="letter-monument" aria-label={`Uppercase ${skill.letter?.toUpperCase()} and lowercase ${skill.letter}`}><span>{skill.letter?.toUpperCase()}</span><strong>{skill.letter}</strong></div><p className="sound-caption">{skill.phoneme} · like the beginning of <strong>{skill.example}</strong></p><AudioButton kind="phoneme" audioKey={skill.id} text={skill.phoneme??''} cue={skill.cue} example={skill.example} src={skill.audioSrc} label="Meet this sound"/><p className="reading-grownup-cue">Try the sound together: {skill.cue}</p><button className="primary" disabled={busy} onClick={onTeach}>Let’s catch it →</button></>:<><div className="listening-orb" aria-hidden="true"><ListenStation className="kid-place-art"/></div><p>Listen to the beginning of <strong>{skill.example}</strong>.</p><AudioButton kind="word" audioKey={skill.example} text={`${skill.example}. Listen to the first sound in ${skill.example}.`} src={skill.audioSrc} label="Hear the clue"/><div className="letter-fireflies" role="group" aria-label="Letter choices">{activity.choices.map((letter,i)=><button key={letter} style={{animationDelay:`${i*.2}s`}} disabled={busy} onClick={()=>onAnswer(letter)} aria-label={`Letter ${letter}`}>{letter}</button>)}</div></>}</div>;
}
