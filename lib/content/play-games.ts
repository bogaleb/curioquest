import type { Question } from "@/lib/curriculum";
import type { ContextTag } from "@/lib/curriculum";
import type { GradeBand } from "@/lib/skill-graph";

/**
 * Content for the three interactive play engines.
 *
 * These are not multiple-choice questions wearing a costume. Bubble Pop asks a child
 * to judge every candidate rather than pick from three; the Balance Scale makes
 * comparison physical and shows the result; the Constellation only reveals its picture
 * when the order is right. Each one has a distinct mechanic and a distinct skill.
 */

const activities: Question[] = [];
const counters = new Map<string, number>();

function add(
  grade: GradeBand,
  subject: Question["subject"],
  level: number,
  skillId: string,
  activityType: Question["activityType"],
  prompt: string,
  answer: string,
  engine: Question["engine"],
  hint: string,
  explanation: string,
  tags: ContextTag[] = [],
) {
  const key = `${grade}-${subject}`;
  const index = counters.get(key) ?? 0;
  counters.set(key, index + 1);
  activities.push({
    id: `play-${grade}-${subject}-${index}`,
    subject,
    grade,
    level,
    skillId,
    activityType,
    phase: "guided",
    estimatedMinutes: 2,
    contextTags: tags,
    prompt,
    // Engine activities are scored from the response, so the option list stays empty.
    options: [],
    answer,
    engine,
    hint,
    explanation,
  });
}

/* ==========================================================================
   BUBBLE POP
   ========================================================================== */
const soundSets: Array<[GradeBand, string, string, string[], string[], string]> = [
  ["prek", "s", "LIT.PK.PA.INITIAL_01", ["sun", "sock", "seal"], ["moon", "hat", "dog"], "Pop every bubble that starts with the /s/ sound."],
  ["prek", "m", "LIT.PK.PA.INITIAL_01", ["moon", "map", "milk"], ["fish", "cat", "sun"], "Pop every bubble that starts with the /m/ sound."],
  ["prek", "b", "LIT.PK.PA.INITIAL_01", ["ball", "bus", "bed"], ["top", "sun", "hen"], "Pop every bubble that starts with the /b/ sound."],
  ["grade1", "sh", "LIT.G1.PH.DIGRAPH_01", ["ship", "shell", "shop"], ["chip", "sip", "tap"], "Pop every bubble that starts with /sh/."],
  ["grade1", "ch", "LIT.G1.PH.DIGRAPH_01", ["chair", "cheese", "chin"], ["share", "tin", "sea"], "Pop every bubble that starts with /ch/."],
  ["grade1", "long a", "LIT.G1.PH.LONG_VOWEL_01", ["cake", "gate", "name"], ["cat", "cap", "man"], "Pop every bubble with the long a sound."],
];

soundSets.forEach(([grade, label, skillId, matching, others, rule]) => {
  const bubbles = [...matching, ...others]
    .map((word, index) => ({ id: `b${index}`, label: word }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const solution = bubbles.filter((bubble) => matching.includes(bubble.label)).map((bubble) => bubble.id);
  add(
    grade, "reading", grade === "prek" ? 1 : 2, skillId, "bubble-pop",
    rule, JSON.stringify(solution),
    { kind: "bubble-pop", rule, bubbles, solution },
    `Say each word out loud. Listen to how it begins.`,
    `${matching.join(", ")} all have the ${label} sound.`,
    ["nature"],
  );
});

const numberSets: Array<[GradeBand, string, number[], number[], string, string]> = [
  ["prek", "MATH.PK.NUM.CARDINAL_01", [2, 4, 6], [1, 3, 5], "Pop every bubble with an even number.", "Even numbers can be shared into two equal groups."],
  ["prek", "MATH.PK.COMP.MORE_01", [7, 8, 9], [1, 2, 3], "Pop every bubble with a number bigger than five.", "Numbers you say later when counting are bigger."],
  ["grade1", "MATH.G1.ADD.WITHIN10_01", [10, 10, 10], [7, 8, 9], "Pop every bubble that makes ten.", "Each popped bubble is worth exactly ten."],
  ["grade1", "MATH.G1.PLACE.TENS_ONES_01", [13, 15, 18], [3, 5, 8], "Pop every teen number.", "Teen numbers have one ten and some ones."],
];

numberSets.forEach(([grade, skillId, matching, others, rule, explanation], setIndex) => {
  const labels = [...matching.map((n, i) => `${n}${i}`), ...others.map((n, i) => `o${n}${i}`)];
  const bubbles = labels.map((_, index) => ({
    id: `n${index}`,
    label: String(index < matching.length ? matching[index] : others[index - matching.length]),
  }));
  const solution = bubbles.slice(0, matching.length).map((bubble) => bubble.id);
  add(
    grade, "math", grade === "prek" ? 1 : 2, skillId, "bubble-pop",
    rule, JSON.stringify(solution),
    { kind: "bubble-pop", rule, bubbles, solution },
    "Read each number. Check it against the rule before you pop it.",
    explanation,
    setIndex % 2 === 0 ? ["puzzles"] : ["space"],
  );
});

/* ==========================================================================
   BALANCE SCALE
   ========================================================================== */
const balances: Array<[GradeBand, string, number, number, string, "more" | "fewer", number]> = [
  ["prek", "MATH.PK.COMP.MORE_01", 3, 5, "🍎", "more", 1],
  ["prek", "MATH.PK.COMP.MORE_01", 6, 2, "🐞", "more", 1],
  ["prek", "MATH.PK.COMP.EQUAL_01", 4, 4, "🌰", "more", 2],
  ["prek", "MATH.PK.COMP.MORE_01", 2, 7, "🐚", "fewer", 2],
  ["grade1", "MATH.G1.SUB.WITHIN10_01", 8, 5, "🧱", "fewer", 2],
  ["grade1", "MATH.G1.ADD.WITHIN10_01", 9, 9, "⭐", "more", 3],
  ["grade1", "MATH.G1.SUB.WITHIN10_01", 7, 10, "🍋", "more", 2],
];

balances.forEach(([grade, skillId, left, right, emoji, question, level]) => {
  const heavier = left === right ? "equal" : left > right ? "left" : "right";
  const expected = question === "more" ? heavier : heavier === "equal" ? "equal" : heavier === "left" ? "right" : "left";
  add(
    grade, "math", level, skillId, "balance",
    question === "more" ? "Which side has more?" : "Which side has fewer?",
    expected,
    { kind: "balance", left: { emoji, count: left }, right: { emoji, count: right }, question },
    "Count one side, then the other. Compare the two numbers.",
    left === right
      ? `Both sides have ${left}. They are the same, so the scale stays level.`
      : `One side has ${left} and the other has ${right}. The heavier side goes down.`,
    ["puzzles", "nature"],
  );
});

/* ==========================================================================
   CONSTELLATION
   ========================================================================== */
type StarSpec = { name: string; labels: string[]; points: Array<[number, number]> };

// Subject is stated rather than inferred from the labels: "Skip Stepper" counts in
// fives but is a pattern skill, and guessing from the label would mis-file it.
const constellations: Array<[GradeBand, Question["subject"], string, number, StarSpec]> = [
  ["prek", "math", "MATH.PK.NUM.RECITE_01", 1, {
    name: "Little Fox",
    labels: ["1", "2", "3", "4", "5"],
    points: [[14, 46], [30, 22], [50, 12], [70, 24], [86, 48]],
  }],
  ["prek", "math", "MATH.PK.NUM.RECITE_01", 1, {
    name: "Sailing Boat",
    labels: ["1", "2", "3", "4"],
    points: [[20, 46], [50, 14], [78, 46], [50, 52]],
  }],
  ["prek", "reading", "LIT.PK.ALPH.NAME_01", 2, {
    name: "Letter Trail",
    labels: ["A", "B", "C", "D"],
    points: [[16, 40], [40, 16], [64, 40], [86, 18]],
  }],
  ["grade1", "math", "MATH.G1.PLACE.TENS_ONES_01", 2, {
    name: "Counting Comet",
    labels: ["2", "4", "6", "8", "10"],
    points: [[12, 50], [32, 30], [52, 16], [72, 30], [90, 50]],
  }],
  ["grade1", "logic", "LOGIC.G1.PATTERN.NUMBER_01", 3, {
    name: "Skip Stepper",
    labels: ["5", "10", "15", "20", "25"],
    points: [[14, 20], [36, 46], [54, 16], [72, 46], [90, 22]],
  }],
  ["grade1", "reading", "LIT.PK.ALPH.NAME_01", 2, {
    name: "Alphabet Arch",
    labels: ["W", "X", "Y", "Z"],
    points: [[18, 48], [40, 18], [62, 18], [84, 48]],
  }],
];

constellations.forEach(([grade, subject, skillId, level, spec]) => {
  const stars = spec.points.map(([x, y], index) => ({
    id: `s${index}`,
    label: spec.labels[index],
    x,
    y,
  }));
  // Rendered out of order so the picture cannot be traced left to right by accident.
  const shuffled = [...stars].sort((left, right) => left.label.localeCompare(right.label));
  const solution = stars.map((star) => star.id);
  add(
    grade,
    subject,
    level,
    skillId,
    "constellation",
    `Join the stars in order to find the ${spec.name}.`,
    JSON.stringify(solution),
    { kind: "constellation", name: spec.name, stars: shuffled, solution },
    "Start at the smallest, then find the next one each time.",
    `In order, the stars make the ${spec.name}.`,
    ["space"],
  );
});

export const playGameActivities = activities;
