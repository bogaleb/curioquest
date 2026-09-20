import {
  skillById,
  type GradeBand,
  type LearningPhase,
  type SkillSubject,
} from "@/lib/skill-graph";
import type { ActivityEngine } from "./activity-types";
import { resolveBand, type LearningBandId } from "./learning-bands";
import { gardenActivities } from "./garden-content";
import { arcadeActivities } from "./arcade-content";
import { wholeChildActivities } from "./content/whole-child";
import { playGameActivities } from "./content/play-games";
import { arcadePlayActivities } from "./content/arcade-play";
import { mathModelActivities } from "./content/math-models";

export type Subject = SkillSubject;
export type ActivityType =
  | "sound-choice"
  | "visual-choice"
  | "story-choice"
  | "number-choice"
  | "pattern-choice"
  | "reasoning-choice" | "counting" | "sorting" | "memory" | "word-builder" | "pattern"
  | "ten-frame" | "route" | "matching" | "ordering"
  | "bubble-pop" | "balance" | "constellation"
  | "number-line" | "number-bond" | "place-value" | "array-builder";
export type ContextTag = "animals" | "stories" | "building" | "space" | "nature" | "puzzles";

export type Question = {
  id: string;
  subject: Subject;
  grade: GradeBand;
  level: number;
  skillId: string;
  activityType: ActivityType;
  phase: LearningPhase;
  estimatedMinutes: number;
  contextTags: ContextTag[];
  prompt: string;
  visual?: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
  engine?: ActivityEngine;
  campaignOnly?: boolean;
  passage?: { title: string; text: string; emoji: string };
  audioLabel?: string;
};

export const questions: Question[] = [];

function add(
  grade: GradeBand,
  subject: Subject,
  level: number,
  skillId: string,
  activityType: ActivityType,
  prompt: string,
  answer: string,
  wrong: string[],
  hint: string,
  explanation: string,
  visual?: string,
  contextTags: ContextTag[] = [],
  phase: LearningPhase = "independent",
) {
  const id = `${grade}-${subject}-${questions.filter((question) => question.grade === grade && question.subject === subject).length}`;
  const options = [answer, ...wrong];
  const rotate = questions.length % options.length;
  questions.push({
    id,
    grade,
    subject,
    level,
    skillId,
    activityType,
    phase,
    estimatedMinutes: 2,
    contextTags,
    prompt,
    answer,
    options: [...options.slice(rotate), ...options.slice(0, rotate)],
    hint,
    explanation,
    visual,
  });
}

const sounds: Array<[string, string, string, string, ContextTag[]]> = [
  ["sun", "s", "m", "t", ["nature"]],
  ["moon", "m", "s", "p", ["space"]],
  ["fish", "f", "b", "s", ["animals"]],
  ["dog", "d", "c", "m", ["animals"]],
  ["ball", "b", "f", "t", ["building"]],
  ["top", "t", "s", "m", ["building"]],
];
sounds.forEach(([word, answer, wrong1, wrong2, tags]) =>
  add(
    "prek",
    "reading",
    1,
    "LIT.PK.PA.INITIAL_01",
    "sound-choice",
    `Which letter starts the word “${word}”?`,
    answer,
    [wrong1, wrong2],
    `Say “${word}” slowly. Listen to the first sound.`,
    `“${word}” starts with ${answer}.`,
    word,
    tags,
    "guided",
  ),
);

const rhymes: Array<[string, string, string, string, ContextTag[]]> = [
  ["cat", "hat", "sun", "dog", ["animals"]],
  ["log", "dog", "fish", "bed", ["nature", "animals"]],
  ["sun", "fun", "cat", "pig", ["nature"]],
  ["hen", "pen", "top", "cup", ["animals"]],
  ["bug", "rug", "dog", "fan", ["animals", "nature"]],
  ["hop", "top", "sun", "bed", ["stories"]],
];
rhymes.forEach(([word, answer, wrong1, wrong2, tags]) =>
  add(
    "prek",
    "reading",
    2,
    "LIT.PK.PA.RHYME_01",
    "sound-choice",
    `Which word rhymes with “${word}”?`,
    answer,
    [wrong1, wrong2],
    "Rhyming words have the same ending sound. Say each word aloud.",
    `“${word}” and “${answer}” share the same ending sound.`,
    word,
    tags,
  ),
);

[
  ["A", "a", "b", "d"],
  ["M", "m", "n", "w"],
  ["S", "s", "c", "z"],
  ["B", "b", "d", "p"],
  ["T", "t", "f", "l"],
  ["R", "r", "n", "h"],
].forEach(([letter, answer, wrong1, wrong2]) =>
  add(
    "prek",
    "reading",
    3,
    "LIT.PK.ALPH.CASE_01",
    "visual-choice",
    `Find the lowercase partner for ${letter}.`,
    answer,
    [wrong1, wrong2],
    "A letter can have an uppercase and a lowercase shape.",
    `Uppercase ${letter} and lowercase ${answer} are the same letter.`,
    letter,
    ["stories"],
    "transfer",
  ),
);

[
  ["c • a • t", "cat", "cap", "can", "animals"],
  ["s • u • n", "sun", "sit", "sad", "nature"],
  ["d • o • g", "dog", "dig", "dot", "animals"],
  ["p • i • g", "pig", "pin", "pan", "animals"],
  ["h • e • n", "hen", "hat", "hop", "animals"],
  ["b • u • s", "bus", "bat", "bin", "stories"],
].forEach(([visual, answer, wrong1, wrong2, tag]) =>
  add(
    "grade1",
    "reading",
    1,
    "LIT.G1.PH.CVC_01",
    "sound-choice",
    "Blend the sounds. What is the word?",
    answer,
    [wrong1, wrong2],
    "Say each sound, then slide the sounds together.",
    `The sounds blend together to make “${answer}”.`,
    visual,
    [tag as ContextTag],
    "guided",
  ),
);

const phonics: Array<[string, string, string, string, string, ContextTag[]]> = [
  ["Which word begins with the /sh/ sound?", "ship", "chip", "sip", "LIT.G1.PH.DIGRAPH_01", ["stories"]],
  ["Which word ends with /ch/?", "much", "mush", "mud", "LIT.G1.PH.DIGRAPH_01", ["stories"]],
  ["Which word has the long a sound?", "cake", "cat", "cap", "LIT.G1.PH.LONG_VOWEL_01", ["stories"]],
  ["Which word has the long i sound?", "bike", "big", "bit", "LIT.G1.PH.LONG_VOWEL_01", ["stories"]],
  ["Which word has the long o sound?", "home", "hot", "hop", "LIT.G1.PH.LONG_VOWEL_01", ["stories"]],
  ["Which word begins with /th/?", "thin", "tin", "fin", "LIT.G1.PH.DIGRAPH_01", ["stories"]],
];
phonics.forEach(([prompt, answer, wrong1, wrong2, skillId, tags]) =>
  add(
    "grade1",
    "reading",
    2,
    skillId,
    "sound-choice",
    prompt,
    answer,
    [wrong1, wrong2],
    "Read each word aloud and listen for the sound.",
    `“${answer}” has the sound we are looking for.`,
    undefined,
    tags,
  ),
);

const comprehension: Array<[string, string, string, string, string, ContextTag[]]> = [
  ["Mia put a seed in soil. She watered it. A sprout grew. What grew?", "A sprout", "A rock", "A cup", "LIT.G1.COMP.RECALL_01", ["nature", "stories"]],
  ["The dog ran to the pond to get a drink. Why did the dog go to the pond?", "It was thirsty", "It was sleepy", "It was cold", "LIT.G1.COMP.CAUSE_01", ["animals", "stories"]],
  ["Sam wore boots and took an umbrella. What was the weather probably like?", "Rainy", "Snowy and sunny", "Very hot", "LIT.G1.COMP.INFER_01", ["nature", "stories"]],
  ["First, Ben washed an apple. Then he cut it. Last, he ate it. What did Ben do first?", "Washed the apple", "Ate the apple", "Cut the apple", "LIT.G1.COMP.SEQUENCE_01", ["stories"]],
  ["Lea saw her friend drop some books. She helped pick them up. How was Lea being?", "Helpful", "Unkind", "Angry", "LIT.G1.COMP.TRAIT_01", ["stories"]],
  ["The bird gathered twigs and made a nest. What were the twigs for?", "Building a nest", "Making a meal", "Washing its wings", "LIT.G1.COMP.CAUSE_01", ["animals", "building", "nature"]],
];
comprehension.forEach(([prompt, answer, wrong1, wrong2, skillId, tags]) =>
  add(
    "grade1",
    "reading",
    3,
    skillId,
    "story-choice",
    prompt,
    answer,
    [wrong1, wrong2],
    "Listen to the story again. Look for a clue that supports your answer.",
    `The story gives us a clue: ${answer.toLowerCase()}.`,
    undefined,
    tags,
    "transfer",
  ),
);

for (let index = 0; index < 18; index += 1) {
  const level = Math.floor(index / 6) + 1;
  const number = (index % 6) + 1;
  if (level === 1) {
    add("prek", "math", level, "MATH.PK.NUM.CARDINAL_01", "number-choice", "How many stars can you count?", String(number), [String(number + 1), String(number + 2)], "Touch each star once as you count.", `There are ${number} stars. The last number you say tells how many.`, "★ ".repeat(number), ["space"], "guided");
  } else if (level === 2) {
    add("prek", "math", level, "MATH.PK.COMP.MORE_01", "number-choice", `Which number is bigger: ${number} or ${number + 2}?`, String(number + 2), [String(number), String(number + 1)], "Count up. A number you say later is bigger.", `${number + 2} is more than ${number}.`, `${number}   •   ${number + 2}`, ["puzzles"]);
  } else {
    add("prek", "math", level, "MATH.PK.COMP.ADD_ONE_01", "number-choice", `You have ${number} blocks and get 1 more. How many now?`, String(number + 1), [String(number), String(number + 2)], `Start at ${number} and count one more.`, `${number} and 1 more make ${number + 1}.`, `${number} + 1 = ?`, ["building"], "transfer");
  }

  const first = level === 1 ? number : level === 2 ? number + 6 : number + 10;
  const second = level === 1 ? 2 : level === 2 ? 3 : 1;
  const answer = level === 2 ? first - second : level === 3 ? 10 + number : first + second;
  const prompt = level === 1
    ? `Nova has ${first} gems and finds ${second} more. How many gems now?`
    : level === 2
      ? `There are ${first} birds. ${second} fly away. How many stay?`
      : `Which number has 1 ten and ${number} ones?`;
  const skillId = level === 1 ? "MATH.G1.ADD.WITHIN10_01" : level === 2 ? (first <= 10 ? "MATH.G1.SUB.WITHIN10_01" : "MATH.G1.SUB.WITHIN20_01") : "MATH.G1.PLACE.TENS_ONES_01";
  add(
    "grade1",
    "math",
    level,
    skillId,
    "number-choice",
    prompt,
    String(answer),
    [String(answer + 1), String(answer - 1)],
    level === 2 ? `Start at ${first}. Count back ${second}.` : level === 3 ? "One ten is 10. Add the ones." : `Start at ${first}, then count ${second} more.`,
    level === 2 ? `${first} − ${second} = ${answer}.` : level === 3 ? `10 + ${number} = ${answer}.` : `${first} + ${second} = ${answer}.`,
    level === 3 ? `1 ten + ${number} ones` : `${first} ${level === 2 ? "−" : "+"} ${second} = ?`,
    level === 2 ? ["animals"] : level === 3 ? ["building"] : ["puzzles"],
    level === 1 ? "guided" : "independent",
  );
}

const patterns = [["●", "▲"], ["★", "●"], ["■", "★"], ["▲", "■"], ["♥", "●"], ["◆", "▲"]];
const logicSkills = ["LOGIC.PK.PATTERN.AB_01", "LOGIC.PK.PATTERN.AAB_01", "LOGIC.PK.PATTERN.ABB_01"];
const gradeOneReasoning = [
  ["Put on socks → put on shoes → ?", "Go for a walk", "Take off socks", "Wash your hair", "LOGIC.G1.SEQUENCE.ROUTINE_01"],
  ["A box holds only red blocks. Which block belongs?", "Red block", "Blue block", "Green block", "LOGIC.G1.CLASSIFY.RULE_01"],
  ["All birds in this puzzle have wings. Pip is a bird. What does Pip have?", "Wings", "Wheels", "Leaves", "LOGIC.G1.DEDUCE.IFTHEN_01"],
  ["You need a tall tower that stays up. What should you build first?", "A wide base", "A tiny top", "A leaning wall", "LOGIC.G1.ENGINEER.STABILITY_01"],
  ["Ava is before Ben. Ben is before Cam. Who is first?", "Ava", "Cam", "Ben", "LOGIC.G1.ORDER.TRANSITIVE_01"],
  ["You have a red cup and a blue cup. The gem is not in the red cup. Where is it?", "Blue cup", "Red cup", "Both cups", "LOGIC.G1.ELIMINATE.CLUE_01"],
];

for (let index = 0; index < 18; index += 1) {
  const level = Math.floor(index / 6) + 1;
  const [first, second] = patterns[index % 6];
  const answer = level === 2 ? second : first;
  add(
    "prek",
    "logic",
    level,
    logicSkills[level - 1],
    "pattern-choice",
    "What comes next in the pattern?",
    answer,
    [level === 2 ? first : second, "◆◆"],
    level === 1 ? "The two shapes take turns." : level === 2 ? "The pattern is two of the first shape, then one of the second." : "Find the group of three that repeats.",
    `The repeating group is ${level === 1 ? `${first} ${second}` : level === 2 ? `${first} ${first} ${second}` : `${first} ${second} ${second}`}.`,
    level === 1 ? `${first} ${second} ${first} ${second} ?` : level === 2 ? `${first} ${first} ${second} ${first} ${first} ?` : `${first} ${second} ${second} ${first} ${second} ${second} ?`,
    ["puzzles"],
    level === 1 ? "guided" : "independent",
  );

  if (level === 1) {
    const number = index + 1;
    add("grade1", "logic", level, "LOGIC.G1.PATTERN.NUMBER_01", "pattern-choice", "What number comes next?", String(number + 6), [String(number + 5), String(number + 7)], "Count how much the number grows each time.", "Add 2 each time to continue the pattern.", `${number}, ${number + 2}, ${number + 4}, ?`, ["puzzles"], "guided");
  } else if (level === 2) {
    const number = index - 3;
    add("grade1", "logic", level, "LOGIC.G1.SPATIAL.DISTANCE_01", "reasoning-choice", `Nova is ${number} steps from home. Nova walks 2 steps toward home. How many steps are left?`, String(Math.max(0, number - 2)), [String(number + 2), String(number + 1)], "Walking toward home makes the distance smaller.", number < 2 ? "Nova reaches home after one step. There are no steps left." : `Taking away 2 steps leaves ${number - 2}.`, `${number} steps → home`, ["puzzles"]);
  } else {
    const [prompt, correct, wrong1, wrong2, skillId] = gradeOneReasoning[index - 12];
    add("grade1", "logic", level, skillId, "reasoning-choice", prompt, correct, [wrong1, wrong2], "Use only the clues in the question. Rule out choices that do not fit.", `“${correct}” fits the clues in the puzzle.`, undefined, skillId.includes("ENGINEER") ? ["building"] : ["puzzles"], "transfer");
  }
}

questions.push(...gardenActivities);
questions.push(...arcadeActivities);
questions.push(...wholeChildActivities);
questions.push(...playGameActivities);
questions.push(...arcadePlayActivities);
questions.push(...mathModelActivities);

/** Published count, for parent-facing copy that would otherwise drift. */
export const activityCount = questions.length;

export function validateCurriculum() {
  const ids = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`Duplicate question ID ${question.id}.`);
    ids.add(question.id);
    const skill = skillById.get(question.skillId);
    if (!skill) throw new Error(`Question ${question.id} references missing skill ${question.skillId}.`);
    if (skill.subject !== question.subject) throw new Error(`Question ${question.id} has a subject mismatch.`);
    if (!skill.active) throw new Error(`Question ${question.id} references inactive skill ${question.skillId}.`);
    if (new Set(question.options).size !== question.options.length) throw new Error(`Question ${question.id} has duplicate choices.`);
    if (!question.engine && !question.options.includes(question.answer)) throw new Error(`Question ${question.id} is missing its answer choice.`);
  }
}

validateCurriculum();

/**
 * Strips the answer key and narrows the activity to what the child's band should see.
 *
 * Choice count is a delivery decision, not a content one: the same authored question
 * offers two options to a three-year-old and four to an eight-year-old. Trimming
 * happens here, on the server, so the correct answer is always retained and scoring is
 * unaffected — the stored answer never changes.
 */
export function publicQuestion(question: Question, band?: LearningBandId) {
  const { answer, explanation, ...original } = question;
  const safe = band ? { ...original, options: narrowChoices(original.options, answer, band) } : original;
  // Intentionally excluded from the child response until server-side scoring.
  void answer; void explanation;
  if (safe.engine?.kind === "sorting" || safe.engine?.kind === "matching" || safe.engine?.kind === "ordering"
    || safe.engine?.kind === "bubble-pop" || safe.engine?.kind === "constellation") {
    const { solution, ...engine } = safe.engine;
    void solution;
    return { ...safe, engine };
  }
  return safe;
}

/**
 * Keeps the answer plus as many distractors as the band allows, preserving the
 * authored order so the choice layout is stable between renders.
 */
function narrowChoices(options: string[], answer: string, band: LearningBandId) {
  const limit = resolveBand(band).delivery.maxChoices;
  if (options.length <= limit || !options.includes(answer)) return options;
  const distractors = options.filter((option) => option !== answer).slice(0, Math.max(0, limit - 1));
  const kept = new Set([answer, ...distractors]);
  return options.filter((option) => kept.has(option));
}
