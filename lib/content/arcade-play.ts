import type { Question } from "@/lib/curriculum";
import type { GradeTrack } from "@/lib/explorers";

/**
 * Game Zone entries for the three interactive play engines.
 *
 * The Game Zone addresses its content by a fixed id shape —
 * `arcade-<grade>-<game>-<n>` with n spanning three missions of four — so each game
 * here generates exactly twelve activities per content pool. Difficulty climbs across
 * the missions rather than repeating the same task with different words.
 */

const activities: Question[] = [];

function base(grade: GradeTrack, game: string, n: number, subject: Question["subject"], skillId: string) {
  return {
    id: `arcade-${grade}-${game}-${n}`,
    grade,
    subject,
    skillId,
    level: Math.floor(n / 4) + 1,
    phase: "guided" as const,
    estimatedMinutes: 2,
    contextTags: [] as Question["contextTags"],
    options: [] as string[],
  };
}

/* ==========================================================================
   BUBBLE POP — listen for a shared sound, pop every word that has it
   ========================================================================== */
type PopSet = { rule: string; match: string[]; other: string[]; skill: string; why: string };

const popSets: Record<GradeTrack, PopSet[]> = {
  prek: [
    { rule: "Pop every word that starts with /s/.", match: ["sun", "sock", "seed"], other: ["moon", "hat", "dog"], skill: "LIT.PK.PA.INITIAL_01", why: "sun, sock and seed all begin with /s/." },
    { rule: "Pop every word that starts with /m/.", match: ["moon", "map", "mouse"], other: ["fish", "cat", "leaf"], skill: "LIT.PK.PA.INITIAL_01", why: "moon, map and mouse all begin with /m/." },
    { rule: "Pop every word that starts with /b/.", match: ["ball", "bus", "bee"], other: ["top", "sun", "hen"], skill: "LIT.PK.PA.INITIAL_01", why: "ball, bus and bee all begin with /b/." },
    { rule: "Pop every word that starts with /f/.", match: ["fish", "fan", "fox"], other: ["dog", "cup", "pen"], skill: "LIT.PK.PA.INITIAL_01", why: "fish, fan and fox all begin with /f/." },
    { rule: "Pop every word that rhymes with cat.", match: ["hat", "mat", "bat"], other: ["dog", "sun", "cup"], skill: "LIT.PK.PA.RHYME_01", why: "hat, mat and bat all end with the same sound as cat." },
    { rule: "Pop every word that rhymes with sun.", match: ["fun", "run", "bun"], other: ["pig", "hat", "bed"], skill: "LIT.PK.PA.RHYME_01", why: "fun, run and bun rhyme with sun." },
    { rule: "Pop every word that rhymes with dog.", match: ["log", "frog", "fog"], other: ["cat", "cup", "pin"], skill: "LIT.PK.PA.RHYME_01", why: "log, frog and fog rhyme with dog." },
    { rule: "Pop every word that rhymes with bed.", match: ["red", "shed", "sled"], other: ["bus", "map", "sun"], skill: "LIT.PK.PA.RHYME_01", why: "red, shed and sled rhyme with bed." },
    { rule: "Pop every word that starts with /t/.", match: ["top", "ten", "tree", "tap"], other: ["dog", "sun"], skill: "LIT.PK.PA.INITIAL_01", why: "top, ten, tree and tap all begin with /t/." },
    { rule: "Pop every word that starts with /p/.", match: ["pig", "pen", "pot", "park"], other: ["bus", "hen"], skill: "LIT.PK.PA.INITIAL_01", why: "pig, pen, pot and park all begin with /p/." },
    { rule: "Pop every word that rhymes with hop.", match: ["top", "mop", "stop", "pop"], other: ["hat", "sun"], skill: "LIT.PK.PA.RHYME_01", why: "top, mop, stop and pop rhyme with hop." },
    { rule: "Pop every word that rhymes with pig.", match: ["big", "dig", "wig", "fig"], other: ["cup", "bed"], skill: "LIT.PK.PA.RHYME_01", why: "big, dig, wig and fig rhyme with pig." },
  ],
  grade1: [
    { rule: "Pop every word that starts with /sh/.", match: ["ship", "shell", "shop"], other: ["chip", "sip", "tap"], skill: "LIT.G1.PH.DIGRAPH_01", why: "ship, shell and shop all begin with /sh/." },
    { rule: "Pop every word that starts with /ch/.", match: ["chair", "cheese", "chin"], other: ["share", "tin", "sea"], skill: "LIT.G1.PH.DIGRAPH_01", why: "chair, cheese and chin all begin with /ch/." },
    { rule: "Pop every word that starts with /th/.", match: ["thin", "thumb", "think"], other: ["tin", "fin", "sun"], skill: "LIT.G1.PH.DIGRAPH_01", why: "thin, thumb and think all begin with /th/." },
    { rule: "Pop every word that ends with /ch/.", match: ["much", "lunch", "bench"], other: ["mush", "mud", "map"], skill: "LIT.G1.PH.DIGRAPH_01", why: "much, lunch and bench all end with /ch/." },
    { rule: "Pop every word with the long a sound.", match: ["cake", "gate", "name"], other: ["cat", "cap", "man"], skill: "LIT.G1.PH.LONG_VOWEL_01", why: "cake, gate and name have a silent e that makes a say its name." },
    { rule: "Pop every word with the long i sound.", match: ["bike", "kite", "time"], other: ["big", "bit", "pin"], skill: "LIT.G1.PH.LONG_VOWEL_01", why: "bike, kite and time have a silent e that makes i say its name." },
    { rule: "Pop every word with the long o sound.", match: ["home", "bone", "rope"], other: ["hot", "hop", "dot"], skill: "LIT.G1.PH.LONG_VOWEL_01", why: "home, bone and rope have a silent e that makes o say its name." },
    { rule: "Pop every word with the long u sound.", match: ["cube", "tube", "flute"], other: ["cup", "bus", "mug"], skill: "LIT.G1.PH.LONG_VOWEL_01", why: "cube, tube and flute have the long u sound." },
    { rule: "Pop every word that is a CVC word.", match: ["cat", "sun", "pig", "bed"], other: ["cake", "ship"], skill: "LIT.G1.PH.CVC_01", why: "cat, sun, pig and bed each have three sounds: consonant, vowel, consonant." },
    { rule: "Pop every word with a short e sound.", match: ["hen", "bed", "net", "pen"], other: ["cake", "bike"], skill: "LIT.G1.PH.CVC_01", why: "hen, bed, net and pen all have the short e sound." },
    { rule: "Pop every word that starts with a digraph.", match: ["ship", "chin", "thumb", "shell"], other: ["sun", "top"], skill: "LIT.G1.PH.DIGRAPH_01", why: "ship, chin, thumb and shell each begin with two letters making one sound." },
    { rule: "Pop every silent-e word.", match: ["cake", "bike", "home", "cube"], other: ["cat", "hot"], skill: "LIT.G1.PH.LONG_VOWEL_01", why: "cake, bike, home and cube each end in a silent e." },
  ],
};

for (const grade of ["prek", "grade1"] as GradeTrack[]) {
  popSets[grade].forEach((set, n) => {
    const bubbles = [...set.match, ...set.other]
      .map((label, index) => ({ id: `b${index}`, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
    const solution = bubbles.filter((bubble) => set.match.includes(bubble.label)).map((bubble) => bubble.id);
    activities.push({
      ...base(grade, "bubbles", n, "reading", set.skill),
      activityType: "bubble-pop",
      prompt: set.rule,
      answer: JSON.stringify(solution),
      engine: { kind: "bubble-pop", rule: set.rule, bubbles, solution },
      hint: "Say each word out loud and listen carefully before you pop it.",
      explanation: set.why,
      contextTags: ["stories", "nature"],
    });
  });
}

/* ==========================================================================
   BALANCE BAY — which side holds more
   ========================================================================== */
const balanceRounds: Record<GradeTrack, Array<[number, number, string, "more" | "fewer", string]>> = {
  prek: [
    [2, 4, "🍎", "more", "MATH.PK.COMP.MORE_01"], [5, 3, "🐞", "more", "MATH.PK.COMP.MORE_01"],
    [1, 3, "🌰", "more", "MATH.PK.COMP.MORE_01"], [4, 2, "🐚", "more", "MATH.PK.COMP.MORE_01"],
    [3, 3, "🍋", "more", "MATH.PK.COMP.EQUAL_01"], [5, 2, "🌻", "fewer", "MATH.PK.COMP.MORE_01"],
    [2, 6, "🍄", "fewer", "MATH.PK.COMP.MORE_01"], [4, 4, "⭐", "more", "MATH.PK.COMP.EQUAL_01"],
    [6, 3, "🧱", "fewer", "MATH.PK.COMP.MORE_01"], [3, 7, "🐟", "more", "MATH.PK.COMP.MORE_01"],
    [5, 5, "🌸", "fewer", "MATH.PK.COMP.EQUAL_01"], [7, 4, "🍀", "more", "MATH.PK.COMP.MORE_01"],
  ],
  grade1: [
    [6, 9, "🍎", "more", "MATH.G1.ADD.WITHIN10_01"], [8, 5, "🐞", "fewer", "MATH.G1.SUB.WITHIN10_01"],
    [7, 7, "🌰", "more", "MATH.G1.ADD.WITHIN10_01"], [9, 6, "🐚", "more", "MATH.G1.ADD.WITHIN10_01"],
    [10, 7, "🍋", "fewer", "MATH.G1.SUB.WITHIN10_01"], [8, 8, "🌻", "fewer", "MATH.G1.ADD.WITHIN10_01"],
    [12, 9, "🍄", "more", "MATH.G1.PLACE.TENS_ONES_01"], [11, 14, "⭐", "more", "MATH.G1.PLACE.TENS_ONES_01"],
    [13, 13, "🧱", "more", "MATH.G1.PLACE.TENS_ONES_01"], [15, 11, "🐟", "fewer", "MATH.G1.PLACE.TENS_ONES_01"],
    [12, 16, "🌸", "fewer", "MATH.G1.PLACE.TENS_ONES_01"], [14, 14, "🍀", "more", "MATH.G1.PLACE.TENS_ONES_01"],
  ],
};

for (const grade of ["prek", "grade1"] as GradeTrack[]) {
  balanceRounds[grade].forEach(([left, right, emoji, question, skill], n) => {
    const heavier = left === right ? "equal" : left > right ? "left" : "right";
    const expected = question === "more" ? heavier : heavier === "equal" ? "equal" : heavier === "left" ? "right" : "left";
    activities.push({
      ...base(grade, "balance", n, "math", skill),
      activityType: "balance",
      prompt: question === "more" ? "Which side has more?" : "Which side has fewer?",
      answer: expected,
      engine: { kind: "balance", left: { emoji, count: left }, right: { emoji, count: right }, question },
      hint: "Count one side. Then count the other. Which number is bigger?",
      explanation: left === right
        ? `Both sides hold ${left}, so the scale stays level.`
        : `One side holds ${left} and the other holds ${right}. The heavier side dips down.`,
      contextTags: ["puzzles", "nature"],
    });
  });
}

/* ==========================================================================
   STAR LINES — join the stars in order
   ========================================================================== */
type Shape = { name: string; labels: string[]; points: Array<[number, number]>; skill: string };

const arcs: Array<[number, number]> = [[16, 46], [34, 22], [52, 13], [70, 24], [88, 46]];
const waves: Array<[number, number]> = [[14, 24], [34, 48], [52, 18], [72, 48], [90, 24]];
const bows: Array<[number, number]> = [[18, 48], [40, 18], [62, 18], [84, 48]];

const shapes: Record<GradeTrack, Shape[]> = {
  prek: [
    { name: "Little Fox", labels: ["1", "2", "3", "4"], points: bows, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Sailing Boat", labels: ["1", "2", "3", "4"], points: bows, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Garden Gate", labels: ["1", "2", "3", "4"], points: bows, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Paper Kite", labels: ["1", "2", "3", "4"], points: bows, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Rolling Hills", labels: ["1", "2", "3", "4", "5"], points: arcs, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Shooting Star", labels: ["1", "2", "3", "4", "5"], points: waves, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Mountain Path", labels: ["1", "2", "3", "4", "5"], points: arcs, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "River Bend", labels: ["1", "2", "3", "4", "5"], points: waves, skill: "MATH.PK.NUM.RECITE_01" },
    { name: "Letter Trail", labels: ["A", "B", "C", "D"], points: bows, skill: "LIT.PK.ALPH.NAME_01" },
    { name: "Alphabet Arch", labels: ["W", "X", "Y", "Z"], points: bows, skill: "LIT.PK.ALPH.NAME_01" },
    { name: "Reading Ridge", labels: ["A", "B", "C", "D", "E"], points: arcs, skill: "LIT.PK.ALPH.NAME_01" },
    { name: "Storybook Sky", labels: ["L", "M", "N", "O", "P"], points: waves, skill: "LIT.PK.ALPH.NAME_01" },
  ],
  grade1: [
    { name: "Counting Comet", labels: ["2", "4", "6", "8", "10"], points: arcs, skill: "MATH.G1.PLACE.TENS_ONES_01" },
    { name: "Even Echo", labels: ["2", "4", "6", "8"], points: bows, skill: "MATH.G1.PLACE.TENS_ONES_01" },
    { name: "Odd Orbit", labels: ["1", "3", "5", "7"], points: bows, skill: "MATH.G1.PLACE.TENS_ONES_01" },
    { name: "Teen Trail", labels: ["11", "12", "13", "14"], points: bows, skill: "MATH.G1.PLACE.TENS_ONES_01" },
    { name: "Skip Stepper", labels: ["5", "10", "15", "20", "25"], points: waves, skill: "LOGIC.G1.PATTERN.NUMBER_01" },
    { name: "Ten Track", labels: ["10", "20", "30", "40", "50"], points: arcs, skill: "LOGIC.G1.PATTERN.NUMBER_01" },
    { name: "Threefold Path", labels: ["3", "6", "9", "12", "15"], points: waves, skill: "LOGIC.G1.PATTERN.NUMBER_01" },
    { name: "Double Dipper", labels: ["1", "2", "4", "8", "16"], points: arcs, skill: "LOGIC.G1.PATTERN.NUMBER_01" },
    { name: "Countdown Comet", labels: ["20", "19", "18", "17"], points: bows, skill: "MATH.G1.SUB.WITHIN20_01" },
    { name: "Backward Bay", labels: ["15", "14", "13", "12"], points: bows, skill: "MATH.G1.SUB.WITHIN20_01" },
    { name: "Falling Feather", labels: ["10", "8", "6", "4", "2"], points: waves, skill: "MATH.G1.SUB.WITHIN20_01" },
    { name: "Homeward Trail", labels: ["25", "20", "15", "10", "5"], points: arcs, skill: "MATH.G1.SUB.WITHIN20_01" },
  ],
};

for (const grade of ["prek", "grade1"] as GradeTrack[]) {
  shapes[grade].forEach((shape, n) => {
    const stars = shape.labels.map((label, index) => ({
      id: `s${index}`,
      label,
      x: shape.points[index][0],
      y: shape.points[index][1],
    }));
    // Presented out of order so the picture cannot be traced left to right by luck.
    const shuffled = [...stars].sort((left, right) => left.id.localeCompare(right.id)).reverse();
    const solution = stars.map((star) => star.id);
    const subject: Question["subject"] = shape.skill.startsWith("LIT")
      ? "reading"
      : shape.skill.startsWith("LOGIC")
        ? "logic"
        : "math";
    activities.push({
      ...base(grade, "stars", n, subject, shape.skill),
      activityType: "constellation",
      prompt: `Join the stars in order to find the ${shape.name}.`,
      answer: JSON.stringify(solution),
      engine: { kind: "constellation", name: shape.name, stars: shuffled, solution },
      hint: "Find the first one, then look for the next each time.",
      explanation: `Joined in order, the stars draw the ${shape.name}.`,
      contextTags: ["space", "puzzles"],
    });
  });
}

export const arcadePlayActivities = activities;
