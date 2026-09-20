import type {ReadingCatalog,ReadingSkill,ReadingWord,ReadingLetter,ReadingStory} from './types';

/**
 * The scope and sequence for the phonics program.
 *
 * The engine in `engine.ts` was always general — it reads letters, words and stories out
 * of this catalogue and assumes nothing about how many there are. What it had to work
 * with was seven letters, eighteen words and a single two-page story, which is why
 * `RELEASE_STATUS.md` called reading "one vertical slice". The slice was real; it was
 * simply not fed.
 *
 * This feeds it. Nineteen single-letter graphemes, a decodable word list built from
 * them, a set of tricky words, and eight stories. No engine change was needed, which is
 * the point of having built it this way.
 *
 * ## Why the order is what it is
 *
 * The first seven are unchanged. A child part-way through the program has their sequence
 * position stored as mastery against `sound_<letter>` ids, and reordering the early
 * letters would silently move the ground under them. New letters are appended in an
 * order that keeps vowels spread out, so a child is never asked to blend two brand-new
 * vowels in the same week.
 *
 * ## Tricky words
 *
 * Strictly decodable stories made only of CVC words cannot say very much — the original
 * story is "Sam! Sam sat." and that is close to the ceiling. Real phonics programs solve
 * this by teaching a small number of high-frequency words as wholes, and so does this:
 * `pattern: 'tricky'` marks a word that is recognised rather than sounded out. They are
 * excluded from blending and building practice by the engine's existing
 * `pattern === 'CVC'` filters, and gated behind their own skills so they appear in
 * stories only once introduced.
 */

export const readingLetters:ReadingLetter[]=['m','s','a','t','p','i','n','d','g','o','c','k','e','u','r','h','b','f','l'];

const letterData=[
 ['m','/m/','moon','Close your lips and hum gently. Keep the sound going.'],
 ['s','/s/','sun','Let a gentle stream of air hiss between your teeth.'],
 ['a','/ă/','apple','Open your mouth for the short a sound at the start of apple.'],
 ['t','/t/','tap','Touch your tongue behind your top teeth and release a tiny puff. Do not add “uh”.'],
 ['p','/p/','pan','Bring your lips together and release a tiny puff. Do not add “uh”.'],
 ['i','/ĭ/','in','Use the short i sound at the start of in, not the letter name.'],
 ['n','/n/','nap','Touch your tongue behind your top teeth and let the sound hum through your nose.'],
 ['d','/d/','dog','Tongue behind your top teeth, like t, but switch your voice on.'],
 ['g','/g/','gas','Back of the tongue lifts and lets go, with your voice on. Do not add “uh”.'],
 ['o','/ŏ/','octopus','Drop your jaw and round your lips a little for the short o in octopus.'],
 ['c','/k/','cat','Back of the tongue lifts and lets go, with no voice. Same sound as k.'],
 ['k','/k/','kit','The same sound as c. Two letters, one sound — English does that sometimes.'],
 ['e','/ĕ/','egg','A short, flat sound with your mouth slightly open, as at the start of egg.'],
 ['u','/ŭ/','up','A short sound from the middle of your mouth, as at the start of up.'],
 ['r','/r/','rug','Curl the tip of your tongue back a little without touching the roof.'],
 ['h','/h/','hat','Just a quiet breath out. There is no voice in this one.'],
 ['b','/b/','bat','Lips together like p, but switch your voice on.'],
 ['f','/f/','fan','Top teeth on your bottom lip and blow gently.'],
 ['l','/l/','leg','Tip of the tongue behind your top teeth and let the sound flow round the sides.'],
] as const;

/** Introduced together, once a child has enough letters for stories to be worth reading. */
const trickyData=[
 ['tricky_one',['the','a','I','is'],'The first four words we learn by sight.'],
 ['tricky_two',['to','he','she','we','my','said'],'Six more words that do not play by the rules.'],
] as const;

const vowels=new Set(['a','e','i','o','u']);

/** The shape of a word, or null if it is not one this program can honestly call decodable. */
function shapeOf(word:string):ReadingWord['pattern']|null{
  const shape=[...word.toLowerCase()].map(ch=>vowels.has(ch)?'V':'C').join('');
  return shape==='VC'?'VC':shape==='CVC'?'CVC':shape==='VCC'?'VCC':null;
}

const letterSequence=letterData.map(([letter])=>letter as ReadingLetter);

export const readingSkills:ReadingSkill[]=[
 ...letterData.map(([letter,phoneme,example,cue],i)=>({
   id:`sound_${letter}`,letter:letter as ReadingLetter,phoneme,example,cue,
   name:`The ${letter} sound`,domain:'letter-sound' as const,sequence:i,prerequisites:[],
 })),
 {id:'blend_vc',name:'Blend two sounds',domain:'decoding',sequence:letterData.length,prerequisites:['sound_a','sound_m']},
 {id:'blend_cvc',name:'Blend three sounds',domain:'decoding',sequence:letterData.length+1,prerequisites:['sound_m','sound_a','sound_t']},
 {id:'build_cvc',name:'Build a three-sound word',domain:'encoding',sequence:letterData.length+2,prerequisites:['blend_cvc']},
 {id:'story_detail',name:'Understand a tiny story',domain:'comprehension',sequence:letterData.length+3,prerequisites:['sound_s','sound_a','sound_m','sound_t','blend_cvc']},
 ...trickyData.map(([id,,name],i)=>({
   id,name,domain:'decoding' as const,sequence:letterData.length+4+i,
   prerequisites:i===0?['blend_cvc']:[trickyData[i-1][0]],
 })),
];

/**
 * The decodable word list.
 *
 * Every word is spelled with letters from the sequence above and sounds the way it
 * looks, so a child who knows its letters can read it without being told. Meanings are
 * written for a five-year-old and stay concrete; the emoji is there because a word list
 * a child cannot picture is a spelling test.
 */
const wordData=[
 // Two sounds
 ['am','Being, as in “I am Sam.”','💬'],['at','A little word that can tell where','📍'],
 ['an','One of something','1️⃣'],['in','Inside something','📥'],['it','A thing you already mentioned','👉'],
 ['on','Resting on top of something','⬆️'],['up','Towards the sky','🔼'],['us','You and me together','👫'],
 ['if','A word for something that might happen','❓'],
 // Short a
 ['Sam','A person’s name','🧒'],['sat','Rested on a seat or the ground','🪑'],
 ['mat','A small floor covering','🟫'],['map','A drawing that shows places','🗺️'],
 ['tap','Touch something lightly and quickly','👆'],['pat','Touch gently with a flat hand','🤚'],
 ['nap','A short sleep','💤'],['pan','A container for cooking','🍳'],
 ['man','An adult person','🧑'],['tan','A light brown colour','🟤'],
 ['cat','A furry pet that purrs','🐈'],['can','A metal container, or being able to','🥫'],
 ['cap','A soft hat with a peak','🧢'],['bat','A flying animal, or a stick for hitting a ball','🦇'],
 ['bag','Something you carry things in','👜'],['bad','Not good, or not the way it should be','👎'],
 ['dad','Another word for your father','👨'],['had','Held or owned before now','🕰️'],
 ['ham','A kind of cooked meat','🍖'],['hat','Something you wear on your head','🎩'],
 ['rat','A small animal with a long tail','🐀'],['ran','Moved quickly on your feet','🏃'],
 ['rag','An old piece of cloth','🧻'],['lap','The top of your legs when sitting','🦵'],
 ['fan','Something that moves the air','🪭'],['fat','Wide and round','⭕'],
 ['sad','Feeling unhappy','😢'],['gas','Air-like stuff with no shape','💨'],
 ['tag','A little label','🏷️'],['cab','A car you pay to ride in','🚕'],
 ['Pam','A person’s name','👧'],['Dan','A person’s name','🧑'],
 // Short i
 ['pin','A small fastener; ask a grown-up to handle it','📌'],['sit','Rest on a seat or the ground','🪑'],
 ['sip','Take a small drink','🥤'],['tip','The end of something','✏️'],
 ['tin','A kind of metal, or a small metal container','🥫'],['bit','A small piece','🔹'],
 ['big','Large, taking up a lot of room','🐘'],['dig','Make a hole in the ground','⛏️'],
 ['did','Finished doing something before now','✅'],['fin','A flap that helps a fish swim','🐟'],
 ['fit','The right size, or healthy','💪'],['hid','Put somewhere out of sight','🙈'],
 ['hit','Struck something','🏏'],['him','That boy or man','👦'],
 ['lid','The top of a pot or jar','🫙'],['lip','The edge of your mouth','👄'],
 ['lit','Gave out light','💡'],['rib','A curved bone in your chest','🦴'],
 ['rim','The edge all round something','⭕'],['rip','Tear something','📄'],
 ['kid','A young person, or a baby goat','🧒'],['kit','A set of things for a job','🧰'],
 ['pig','A pink farm animal','🐖'],['pit','A deep hole in the ground','🕳️'],
 ['bib','Cloth that keeps a baby clean at meals','🍼'],['Tim','A person’s name','👦'],
 ['Kim','A person’s name','👧'],
 // Short o
 ['dog','A pet that barks','🐕'],['cot','A small bed for a baby','🛏️'],
 ['dot','A tiny round mark','⚫'],['got','Received something','🎁'],
 ['hot','Very warm to touch','🔥'],['hop','A little jump','🦘'],
 ['log','A piece of a tree trunk','🪵'],['lot','A large amount','📚'],
 ['mop','A tool for washing floors','🧹'],['not','A word that means no','🚫'],
 ['pot','A deep round container','🍲'],['rod','A thin straight stick','🎣'],
 ['top','The highest part','🔝'],['cop','Short for a police officer','👮'],
 ['fog','Thick cloud down at the ground','🌫️'],['pod','A case that holds seeds','🫛'],
 ['rob','A person’s name, short for Robert','🧑'],['sob','Cry with loud shaky breaths','😭'],
 ['nod','Move your head to say yes','🙂'],
 // Short e
 ['bed','Where you sleep','🛏️'],['beg','Ask for something over and over','🙏'],
 ['bet','Say what you think will happen','🎲'],['fed','Gave food to someone or something','🍽️'],
 ['get','Go and take something','🤲'],['hen','A female chicken','🐔'],
 ['leg','The part of you that walks','🦵'],['let','Allow someone to do something','👍'],
 ['men','More than one man','👬'],['met','Came together with someone','🤝'],
 ['net','Cloth full of holes for catching things','🥅'],['pen','Something you write with','🖊️'],
 ['pet','An animal that lives with you','🐹'],['red','The colour of a tomato','🔴'],
 ['set','Put somewhere, or a group of things','📦'],['ten','The number after nine','🔟'],
 ['peg','A small pin for holding things','🪝'],['den','A cosy hidden place','🏕️'],
 ['Ben','A person’s name','👦'],
 // Short u
 ['bud','A flower before it opens','🌷'],['bug','A tiny crawling creature','🐞'],
 ['bun','A small round bread','🥯'],['bus','A big vehicle that carries many people','🚌'],
 ['but','A word that adds something different','↩️'],['cub','A baby bear or lion','🐻'],
 ['cup','Something you drink from','☕'],['cut','Divide with something sharp','✂️'],
 ['dug','Made a hole by digging','⛏️'],['fun','Enjoyable and good to do','🎉'],
 ['gum','Something chewy','🍬'],['hug','Hold someone kindly','🤗'],
 ['hum','Sing with your lips closed','🎵'],['hut','A small simple building','🛖'],
 ['mud','Soil that is wet and sticky','🟤'],['mug','A big cup with a handle','☕'],
 ['nut','A hard seed you can eat','🥜'],['pup','A young dog, also called a puppy','🐶'],
 ['rub','Move your hand back and forth on something','🖐️'],['rug','A small carpet','🟫'],
 ['run','Move fast on your feet','🏃'],['sun','The star that lights our day','☀️'],
 ['tub','A big open container','🛁'],['tug','Give a firm pull','🪢'],
 ['Gus','A person’s name','🧑'],
 // Three sounds starting with a vowel
 ['ant','A tiny six-legged insect','🐜'],['egg','What a bird lays, with a shell round it','🥚'],['and','A word that joins things','➕'],
 ['end','The last part','🏁'],
] as const;

const trickyWords:ReadingWord[]=trickyData.flatMap(([skillId,words])=>words.map(word=>({
  id:word.toLowerCase(),word,
  graphemes:[...word.toLowerCase()],
  phonemes:[...word.toLowerCase()],
  requiredSkills:[skillId],
  pattern:'tricky' as const,
  meaning:`A word we learn by sight, because its letters do not say what you expect.`,
  emoji:'👁️',
})));

export const readingWords:ReadingWord[]=[
 ...wordData.map(([word,meaning,emoji])=>{
   const letters=[...word.toLowerCase()];
   return {
     id:word.toLowerCase(),word,
     graphemes:letters,
     phonemes:letters.map(l=>letterData.find(d=>d[0]===l)?.[1]??l),
     requiredSkills:[...new Set(letters.map(l=>`sound_${l}`))],
     // Authoring mistakes fail loudly here rather than quietly serving a child a word
     // this program has no business calling decodable. A test asserts none are 'tricky'.
     pattern:shapeOf(word)??'tricky',
     meaning,emoji,
   };
 }),
 ...trickyWords,
];

/**
 * Decodable stories, in the order a child reaches them.
 *
 * Every word on every page is in the list above, and `sentenceIsDecodable` enforces it
 * at runtime — a story containing one word the child has not been taught simply does not
 * appear, rather than appearing and defeating them.
 */
const storyData:Array<Omit<ReadingStory,'requiredSkills'>>=[
 {id:'sam-sat',title:'Sam Sat',
  pages:['Sam!','Sam sat.'],question:'What did Sam do?',choices:['sat','ran'],answer:'sat',emoji:'🧒'},
 {id:'the-map',title:'The Map',
  pages:['Sam had a map.','The map is in a bag.'],question:'Where is the map?',choices:['in a bag','on a mat'],answer:'in a bag',emoji:'🗺️'},
 {id:'the-pup',title:'The Pup',
  pages:['The pup is up.','The pup had a nap on the mat.'],question:'Where did the pup nap?',choices:['on the mat','in the tub'],answer:'on the mat',emoji:'🐶'},
 {id:'hot-pot',title:'The Hot Pot',
  pages:['The pot is hot.','It is not fun to tap a hot pot.'],question:'What must you not tap?',choices:['the hot pot','the red bus'],answer:'the hot pot',emoji:'🍲'},
 {id:'red-hen',title:'The Red Hen',
  pages:['The hen is red.','The red hen sat on a big egg.'],question:'What did the hen sit on?',choices:['a big egg','a red rug'],answer:'a big egg',emoji:'🐔'},
 {id:'big-bug',title:'Ben and the Bug',
  pages:['Ben is in the mud.','A big bug ran up to him. He did not get it.'],question:'Did Ben get the bug?',choices:['he did not','he did'],answer:'he did not',emoji:'🐞'},
 {id:'kim-kit',title:'Kim and the Kit',
  pages:['Kim got a kit.','She had to fit the lid on it.'],question:'What did Kim fit on?',choices:['the lid','the bed'],answer:'the lid',emoji:'🧰'},
 {id:'fun-run',title:'The Fun Run',
  pages:['We ran in the sun.','I said the run is fun.'],question:'How was the run?',choices:['fun','sad'],answer:'fun',emoji:'🏃'},
];

const wordIndex=new Map(readingWords.map(word=>[word.word.toLowerCase(),word]));

/**
 * A story's required skills, derived from the words actually on its pages.
 *
 * Hand-listing these is a standing invitation to get them wrong — the first draft of
 * this file declared "The Map" as needing m, a, p, s and t, and then put "in" and "bag"
 * on page two. A story that under-declares is offered to a child who cannot read it,
 * which is the one failure this program exists to prevent. Deriving the list makes that
 * unrepresentable, and `blend_cvc` is added because reading any of these means blending.
 */
function skillsForStory(story:Omit<ReadingStory,'requiredSkills'>):string[]{
  const needed=new Set<string>(['blend_cvc']);
  for(const page of story.pages){
    for(const token of page.toLowerCase().match(/[a-z]+/g)??[]){
      const word=wordIndex.get(token);
      if(!word)throw new Error(`Story ${story.id} uses "${token}", which is not in the word list.`);
      for(const skill of word.requiredSkills)needed.add(skill);
    }
  }
  return [...needed];
}

const stories:ReadingStory[]=storyData.map(story=>({...story,requiredSkills:skillsForStory(story)}));

export const defaultReadingCatalog:ReadingCatalog={
  skills:readingSkills,
  words:readingWords,
  settings:{sequence:letterSequence,readyScore:.3,masteredScore:.85,reviewDays:[1,3,7,14,30]},
  stories,
};
