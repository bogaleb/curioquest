import type {ReadingCatalog,ReadingSkill,ReadingWord,ReadingLetter} from './types';
export const readingLetters:ReadingLetter[]=['m','s','a','t','p','i','n'];
const letterData=[
 ['m','/m/','moon','Close your lips and hum gently. Keep the sound going.'],
 ['s','/s/','sun','Let a gentle stream of air hiss between your teeth.'],
 ['a','/ă/','apple','Open your mouth for the short a sound at the start of apple.'],
 ['t','/t/','tap','Touch your tongue behind your top teeth and release a tiny puff. Do not add “uh”.'],
 ['p','/p/','pan','Bring your lips together and release a tiny puff. Do not add “uh”.'],
 ['i','/ĭ/','in','Use the short i sound at the start of in, not the letter name.'],
 ['n','/n/','nap','Touch your tongue behind your top teeth and let the sound hum through your nose.'],
] as const;
export const readingSkills:ReadingSkill[]=[...letterData.map(([letter,phoneme,example,cue],i)=>({id:`sound_${letter}`,letter,phoneme,example,cue,name:`The ${letter} sound`,domain:'letter-sound' as const,sequence:i,prerequisites:[]})),
 {id:'blend_vc',name:'Blend two sounds',domain:'decoding',sequence:7,prerequisites:['sound_a','sound_m']},
 {id:'blend_cvc',name:'Blend three sounds',domain:'decoding',sequence:8,prerequisites:['sound_m','sound_a','sound_t']},
 {id:'build_cvc',name:'Build a three-sound word',domain:'encoding',sequence:9,prerequisites:['blend_cvc']},
 {id:'story_detail',name:'Understand a tiny story',domain:'comprehension',sequence:10,prerequisites:['sound_s','sound_a','sound_m','sound_t','blend_cvc']},
];
const wordData=[['am','Being, as in “I am Sam.”','💬'],['at','A little word that can tell where','📍'],['Sam','A person’s name','🧒'],['sat','Rested on a seat or the ground','🪑'],['mat','A small floor covering','🟫'],['map','A drawing that shows places','🗺️'],['tap','Touch gently','👆'],['pat','Touch gently with a flat hand','🤚'],['nap','A short sleep','💤'],['pan','A container for cooking','🍳'],['pin','A small fastener; ask a grown-up to handle it','📌'],['sit','Rest on a seat or the ground','🪑'],['sip','Take a small drink','🥤'],['tip','The end of something','✏️'],['tin','A kind of metal or a small metal container','🥫'],['man','An adult person','🧑'],['tan','A light brown color','🟤'],['ant','A tiny six-legged insect','🐜']] as const;
export const readingWords:ReadingWord[]=wordData.map(([word,meaning,emoji])=>({id:word.toLowerCase(),word,graphemes:word.toLowerCase().split(''),phonemes:word.toLowerCase().split('').map(l=>letterData.find(d=>d[0]===l)?.[1]??l),requiredSkills:[...new Set(word.toLowerCase().split('').map(l=>`sound_${l}`))],pattern:word.length===2?'VC':word==='ant'?'VCC':'CVC',meaning,emoji}));
export const defaultReadingCatalog:ReadingCatalog={skills:readingSkills,words:readingWords,settings:{sequence:readingLetters,readyScore:.3,masteredScore:.85,reviewDays:[1,3,7,14,30]},stories:[{id:'sam-sat',title:'Sam Sat',requiredSkills:['sound_s','sound_a','sound_m','sound_t','blend_cvc'],pages:['Sam!','Sam sat.'],question:'What did Sam do?',choices:['sat','ran'],answer:'sat',emoji:'🧒'}]};
