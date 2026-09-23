import type {ReadingLetter} from './types';

/**
 * Sound hunt: "Which one starts with /m/?"
 *
 * The step co-play phonics programmes (Reading.com's "sound stories") put straight after a
 * new letter: before a child reads the letter in a word, they *hear* its sound at the start
 * of words they already know. It is phonemic awareness — listening, not reading — so the
 * words here do not need to be decodable. They need to be easy to picture, which is why
 * this list is separate from the word catalogue, where "mat" can only be drawn as a brown
 * square.
 *
 * Every word starts with the letter's *short* sound as taught in `content.ts`: "apple" not
 * "acorn", "egg" not "eagle", "umbrella" not "unicorn".
 */
export type HuntPicture={word:string;emoji:string};

export const huntPictures:Record<ReadingLetter,HuntPicture[]>={
  m:[{word:'moon',emoji:'🌙'},{word:'mouse',emoji:'🐭'},{word:'mug',emoji:'☕'}],
  s:[{word:'sun',emoji:'☀️'},{word:'sock',emoji:'🧦'},{word:'snake',emoji:'🐍'}],
  a:[{word:'apple',emoji:'🍎'},{word:'ant',emoji:'🐜'},{word:'alligator',emoji:'🐊'}],
  t:[{word:'tent',emoji:'⛺'},{word:'tiger',emoji:'🐯'},{word:'ten',emoji:'🔟'}],
  p:[{word:'pig',emoji:'🐖'},{word:'pen',emoji:'🖊️'},{word:'pan',emoji:'🍳'}],
  i:[{word:'insect',emoji:'🐛'},{word:'inch',emoji:'📏'}],
  n:[{word:'nut',emoji:'🥜'},{word:'nest',emoji:'🪺'},{word:'nose',emoji:'👃'}],
  d:[{word:'dog',emoji:'🐕'},{word:'duck',emoji:'🦆'},{word:'drum',emoji:'🥁'}],
  g:[{word:'goat',emoji:'🐐'},{word:'gift',emoji:'🎁'},{word:'guitar',emoji:'🎸'}],
  o:[{word:'octopus',emoji:'🐙'},{word:'otter',emoji:'🦦'},{word:'ox',emoji:'🐂'}],
  c:[{word:'cat',emoji:'🐈'},{word:'cake',emoji:'🎂'},{word:'cow',emoji:'🐄'}],
  k:[{word:'kite',emoji:'🪁'},{word:'key',emoji:'🔑'},{word:'king',emoji:'🤴'}],
  e:[{word:'egg',emoji:'🥚'},{word:'elephant',emoji:'🐘'},{word:'elf',emoji:'🧝'}],
  u:[{word:'umbrella',emoji:'☂️'},{word:'up',emoji:'⬆️'}],
  r:[{word:'rabbit',emoji:'🐇'},{word:'rocket',emoji:'🚀'},{word:'ring',emoji:'💍'}],
  h:[{word:'hat',emoji:'🎩'},{word:'hen',emoji:'🐔'},{word:'house',emoji:'🏠'}],
  b:[{word:'bus',emoji:'🚌'},{word:'bee',emoji:'🐝'},{word:'ball',emoji:'⚽'}],
  f:[{word:'fish',emoji:'🐟'},{word:'fox',emoji:'🦊'},{word:'frog',emoji:'🐸'}],
  l:[{word:'leaf',emoji:'🍃'},{word:'lion',emoji:'🦁'},{word:'lemon',emoji:'🍋'}],
};

/** Letters that share a sound, so neither is ever the "wrong" picture for the other. */
const sameSound:Record<string,string>={c:'k',k:'c'};

export type HuntRound={letter:ReadingLetter;choices:HuntPicture[];answer:string};

/**
 * Rounds for one letter, never answered by `exclude`. Deterministic from `seed`, so a round never reshuffles under a
 * child's finger on re-render, and the answer's position moves between rounds.
 */
export function huntRounds(letter:ReadingLetter,seed=0,count=2,exclude?:string):HuntRound[]{
  // The letter's own example word is already in the question ("like moon"), so it is never
  // the answer: that would be matching a word, not hearing a sound.
  const kept=huntPictures[letter].filter(p=>p.word!==exclude?.toLowerCase());
  const targets=kept.length?kept:huntPictures[letter];
  const others=(Object.keys(huntPictures) as ReadingLetter[]).filter(l=>l!==letter&&sameSound[letter]!==l);
  return Array.from({length:Math.min(count,targets.length)},(_,round)=>{
    const answer=targets[(seed+round)%targets.length];
    const a=others[(seed*3+round*5+1)%others.length],b=others[(seed*3+round*5+8)%others.length];
    const pick=(l:ReadingLetter,n:number)=>huntPictures[l][n%huntPictures[l].length];
    const wrong=[pick(a,seed+round),pick(b===a?others[(others.indexOf(a)+1)%others.length]:b,seed+round+1)];
    const at=(seed+round)%3,choices=[...wrong];
    choices.splice(at,0,answer);
    return {letter,choices,answer:answer.word};
  });
}
