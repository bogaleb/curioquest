import type {ReadingActivity,ReadingSkill,ReadingWord} from './types';

/** What a grown-up says at each step: I show, we try, you try, and the one correction to reach for. See `components/reading/GrownUpCoach.tsx`. */
export type CoachScript={show:string;together:string;alone:string;stuck:string};

export function coachScript(activity:ReadingActivity,{skill,word,teaching}:{skill?:ReadingSkill;word?:ReadingWord;teaching:boolean}):CoachScript{
  if(activity.kind==='letter-catch'){
    const letter=skill?.letter??activity.target,sound=skill?.phoneme??letter;
    if(teaching)return {
      show:`Point to ${letter} and say: “This letter says ${sound}.” Say the sound, not the letter name.`,
      together:`Say ${sound} together three times. ${skill?.cue??''}`.trim(),
      alone:`Ask: “What does this letter say?” Wait a slow count of five before you help.`,
      stuck:`Model it once more, then ask again. Short and cheerful beats long and careful.`,
    };
    return {
      show:`Say “${skill?.example??''}” slowly, stretching only the first sound.`,
      together:`Say the first sound together, then look at the letters.`,
      alone:`Let your child choose. Try not to point or nod towards an answer.`,
      stuck:`If they pick the wrong letter, say both sounds side by side so they can hear the difference.`,
    };
  }
  if(activity.kind==='blend-train'){
    const sounds=word?.phonemes.join(' ')??'',whole=word?.word??activity.target;
    return {
      show:`Touch under each letter and say its sound: ${sounds}. Then sweep your finger under the word and say it fast: “${whole}”.`,
      together:`Do it together, holding each sound into the next with no gaps.`,
      alone:`Now let your child touch, sound and sweep on their own.`,
      stuck:`If the sounds come out with gaps, stretch them joined, like one long sound, then say the word.`,
    };
  }
  if(activity.kind==='sound-boxes'){
    const whole=word?.word??activity.target;
    return {
      show:`Say “${whole}” slowly. Hold up one finger for each sound you hear.`,
      together:`Say it together and tap a finger for each sound.`,
      alone:`Ask: “What is the first sound? Which letter makes it?” Then the next sound.`,
      stuck:`Say just the sound they are missing, stretched, and let them find its letter.`,
    };
  }
  return {
    show:`Read the title together. Point under each word as it is read.`,
    together:`Your child reads; you point. Words with a heart are heart words: we know them by heart, so say them together if needed.`,
    alone:`After each page ask: “What happened?” Praise the effort: “You sounded that out!”`,
    stuck:`If they guess from the first letter, cover the picture and ask them to say every sound in the word.`,
  };
}
