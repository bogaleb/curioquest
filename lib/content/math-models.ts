import type { ContextTag, Question } from "@/lib/curriculum";
import type { GradeBand } from "@/lib/skill-graph";

/**
 * Math as models a child moves, rather than sentences with numbers under them.
 *
 * Wave 06 asks for concrete → representational → abstract, and forbids "plain text
 * question + four-button design" as the default. Every activity here hands the child a
 * manipulative first: a number line to hop along, a bond to complete, a place-value mat
 * to build on, an array to plant. The numeral is what the model ends up showing, not
 * the thing they are asked to recognise.
 *
 * Nothing here is guessable. A four-button question about 6 + 3 can be answered by
 * elimination; a number line cannot, because there is no list of candidates to
 * eliminate from. That difference is also why the mastery record means more than it
 * did — an independent answer here is evidence the child modelled the problem.
 *
 * Hints follow the wave's rule: reveal the strategy, never the answer. "Start on the
 * bigger number and count on" is a hint. "It is nine" is not.
 */

const activities: Question[] = [];
const counters = new Map<string, number>();

function add(
  grade: GradeBand,
  level: number,
  skillId: string,
  activityType: Question["activityType"],
  prompt: string,
  answer: string,
  engine: Question["engine"],
  hint: string,
  explanation: string,
  tags: ContextTag[] = [],
  phase: Question["phase"] = "independent",
) {
  const key = `${grade}-math`;
  const index = counters.get(key) ?? 0;
  counters.set(key, index + 1);
  activities.push({
    id: `model-${key}-${index}`,
    grade,
    subject: "math",
    level,
    skillId,
    activityType,
    phase,
    estimatedMinutes: 2,
    contextTags: tags,
    prompt,
    answer,
    options: [],
    hint,
    explanation,
    engine,
  });
}

/* ------------------------------------------------------- pre-K: counting on a line */

/**
 * Counting on, as distance travelled.
 *
 * A pre-K child who can recite to ten often cannot start from four and keep going —
 * the sequence is a song rather than a structure. Hopping makes the restart physical.
 */
const preKHops: Array<[number, number, string, ContextTag[]]> = [
  [2, 2, "Pip hops along the stepping stones.", ["nature"]],
  [3, 2, "Nova the fox hops toward the berry bush.", ["animals"]],
  [4, 1, "One more hop to reach the picnic blanket.", ["stories"]],
  [1, 4, "The little frog crosses the pond.", ["animals"]],
  [5, 2, "Two more stones to the far bank.", ["nature"]],
  [3, 3, "Three hops to the lantern.", ["stories"]],
];
preKHops.forEach(([start, jump, story, tags], index) => {
  add(
    "prek", Math.min(3, Math.floor(index / 2) + 1),
    "MATH.PK.NUM.RECITE_01",
    "number-line",
    `${story} Start on ${start} and hop forward ${jump}. Where do you land?`,
    String(start + jump),
    { kind: "number-line", min: 0, max: 10, start, tickEvery: 1 },
    `Put your finger on ${start}. Now count each hop out loud: one, two…`,
    `Starting at ${start} and hopping ${jump} lands on ${start + jump}. You did not go back to one — you counted on.`,
    tags,
    index < 2 ? "guided" : "independent",
  );
});

/* --------------------------------------------- pre-K: composing small numbers */

/**
 * Bonds small enough to see at a glance. A missing part here is a child's first
 * subtraction, met as "what else is in the box" rather than as taking away.
 */
const preKBonds: Array<[number, number, number, "whole" | "left" | "right", string, string, ContextTag[]]> = [
  [4, 2, 2, "whole", "🍎", "Nova puts 2 red apples and 2 green apples in the basket.", ["nature"]],
  [5, 3, 2, "whole", "🐚", "Pip finds 3 smooth shells and 2 spotted shells.", ["nature"]],
  [5, 2, 3, "right", "⭐", "There are 5 stars altogether. 2 are above the tree.", ["space"]],
  [6, 4, 2, "right", "🌷", "6 tulips in the row. 4 are open.", ["nature"]],
  [6, 2, 4, "left", "🐞", "6 beetles on the leaf. 4 of them are resting.", ["animals"]],
  [7, 3, 4, "whole", "🧺", "3 rolls in one basket, 4 in the other.", ["stories"]],
];
preKBonds.forEach(([whole, left, right, missing, emoji, story, tags], index) => {
  const answer = missing === "whole" ? whole : missing === "left" ? left : right;
  add(
    "prek", Math.min(3, Math.floor(index / 2) + 1),
    missing === "whole" ? "MATH.PK.COMP.ADD_ONE_01" : "MATH.PK.NUM.CARDINAL_01",
    "number-bond",
    `${story} ${missing === "whole" ? "How many altogether?" : "How many are in the other part?"}`,
    String(answer),
    {
      kind: "number-bond", emoji,
      whole: missing === "whole" ? null : whole,
      parts: [missing === "left" ? null : left, missing === "right" ? null : right],
    },
    missing === "whole"
      ? "Count the first part, then keep counting into the second part."
      : "Count up from the part you can see until you reach the whole.",
    missing === "whole"
      ? `${left} and ${right} make ${whole}. Two parts, one whole.`
      : `${whole} is made of ${left} and ${right}. The part you could not see is ${answer}.`,
    tags,
    index < 2 ? "guided" : "independent",
  );
});

/* ------------------------------------------------- pre-K: arrays as equal groups */

const preKArrays: Array<[number, number, string, string, ContextTag[]]> = [
  [2, 3, "🌻", "Plant 2 rows of sunflowers with 3 in each row.", ["nature"]],
  [3, 2, "🥕", "Plant 3 rows of carrots with 2 in each row.", ["nature"]],
  [2, 4, "🍓", "Plant 2 rows of strawberries with 4 in each row.", ["nature"]],
];
preKArrays.forEach(([rows, columns, emoji, prompt, tags], index) => {
  add(
    "prek", index + 1,
    "MATH.PK.NUM.CARDINAL_01",
    "array-builder",
    prompt,
    `${rows},${columns}`,
    { kind: "array-builder", rows, columns, emoji, maxRows: 5, maxColumns: 6 },
    "Build one row first and count it. Then add another row exactly the same.",
    `${rows} rows of ${columns} is ${rows * columns}. Equal rows make counting quicker than counting one by one.`,
    tags,
  );
});

/* ------------------------------------------- grade 1: adding and taking away on a line */

const gradeOneHops: Array<[number, number, "forward" | "back", string, ContextTag[]]> = [
  [6, 3, "forward", "The train leaves station 6 and travels 3 stations on.", ["building"]],
  [8, 5, "back", "The kite drifts back from 8 by 5.", ["nature"]],
  [7, 4, "forward", "Nova is on 7 and takes 4 more steps toward the lookout.", ["stories"]],
  [12, 4, "back", "12 lanterns are lit. 4 blow out.", ["stories"]],
  [9, 6, "forward", "The beetle starts at 9 and crawls 6 further along the branch.", ["animals"]],
  [15, 7, "back", "15 stepping stones. The tide covers the last 7.", ["nature"]],
  [11, 5, "forward", "Pip is on 11 and rides 5 more stops.", ["building"]],
  [14, 6, "back", "14 apples on the branch. 6 are picked.", ["nature"]],
];
gradeOneHops.forEach(([start, jump, direction, story, tags], index) => {
  const landing = direction === "forward" ? start + jump : start - jump;
  const within20 = Math.max(start, landing) > 10;
  add(
    "grade1", Math.min(3, Math.floor(index / 3) + 1),
    direction === "forward"
      ? (within20 ? "MATH.G1.ADD.WITHIN20_01" : "MATH.G1.ADD.WITHIN10_01")
      : (within20 ? "MATH.G1.SUB.WITHIN20_01" : "MATH.G1.SUB.WITHIN10_01"),
    "number-line",
    `${story} Start on ${start} and hop ${direction === "forward" ? "forward" : "back"} ${jump}. Where do you land?`,
    String(landing),
    { kind: "number-line", min: 0, max: 20, start, tickEvery: 5 },
    direction === "forward"
      ? `Do not start counting at one. Start on ${start} and count ${jump} hops on.`
      : `Start on ${start} and count ${jump} hops back. Each hop is one less.`,
    `${start} ${direction === "forward" ? "+" : "−"} ${jump} = ${landing}. The number line shows it as a distance, not a fact to remember.`,
    tags,
    index < 2 ? "guided" : "independent",
  );
});

/* ------------------------------------------------- grade 1: bonds within twenty */

const gradeOneBonds: Array<[number, number, number, "whole" | "left" | "right", string, string, ContextTag[]]> = [
  [10, 6, 4, "right", "🫐", "10 blueberries in the bowl. 6 are on this side.", ["nature"]],
  [10, 7, 3, "left", "🔵", "10 beads on the string. 3 are at the end.", ["building"]],
  [13, 8, 5, "whole", "🌰", "8 acorns in one pile and 5 in the other.", ["animals"]],
  [15, 9, 6, "right", "🍄", "15 mushrooms in the clearing. 9 are in the sun.", ["nature"]],
  [16, 8, 8, "whole", "🧱", "8 bricks in each of two stacks.", ["building"]],
  [18, 10, 8, "left", "✨", "18 sparks. 8 of them drift left.", ["space"]],
];
gradeOneBonds.forEach(([whole, left, right, missing, emoji, story, tags], index) => {
  const answer = missing === "whole" ? whole : missing === "left" ? left : right;
  add(
    "grade1", Math.min(3, Math.floor(index / 2) + 1),
    missing === "whole"
      ? (whole > 10 ? "MATH.G1.ADD.WITHIN20_01" : "MATH.G1.ADD.WITHIN10_01")
      : (whole > 10 ? "MATH.G1.SUB.WITHIN20_01" : "MATH.G1.SUB.WITHIN10_01"),
    "number-bond",
    `${story} ${missing === "whole" ? "How many altogether?" : "How many are in the other part?"}`,
    String(answer),
    {
      kind: "number-bond", emoji,
      whole: missing === "whole" ? null : whole,
      parts: [missing === "left" ? null : left, missing === "right" ? null : right],
    },
    whole === 10
      ? "Ten is a friendly number. What goes with the part you can see to make ten?"
      : missing === "whole"
        ? "Start with the bigger part and count the smaller one on."
        : "Count up from the part you can see until you reach the whole. Count the hops.",
    missing === "whole"
      ? `${left} + ${right} = ${whole}. Both parts sit inside the whole, which is why you can add them in either order and land in the same place.`
      : `${whole} − ${missing === "left" ? right : left} = ${answer}. A missing part is subtraction, drawn as the same picture as addition.`,
    tags,
    index < 2 ? "guided" : "independent",
  );
});

/* --------------------------------------------- grade 1: place value on the mat */

const gradeOneTeens: Array<[number, string, ContextTag[]]> = [
  [13, "Build 13 on the mat.", ["building"]],
  [16, "Build 16 on the mat.", ["building"]],
  [11, "Build 11 on the mat.", ["puzzles"]],
  [19, "Build 19 on the mat.", ["puzzles"]],
  [24, "Build 24 on the mat.", ["building"]],
  [30, "Build 30 on the mat.", ["puzzles"]],
];
gradeOneTeens.forEach(([target, prompt, tags], index) => {
  const tens = Math.floor(target / 10), ones = target % 10;
  add(
    "grade1", Math.min(3, Math.floor(index / 2) + 1),
    "MATH.G1.PLACE.TENS_ONES_01",
    "place-value",
    `${prompt} Remember: the mat only holds nine loose ones.`,
    `${tens},${ones}`,
    { kind: "place-value", target, maxTens: 4 },
    "Make tens first, then add the loose ones. If you end up with ten ones, trade them for a ten.",
    ones === 0
      ? `${target} is ${tens} tens and no ones at all.`
      : `${target} is ${tens} ${tens === 1 ? "ten" : "tens"} and ${ones} ones. That is what the two digits are telling you.`,
    tags,
    index === 0 ? "guided" : "independent",
  );
});

/* ------------------------------------------ grade 1: arrays toward multiplication */

const gradeOneArrays: Array<[number, number, string, string, ContextTag[]]> = [
  [3, 4, "🍎", "Pack 3 rows of apples with 4 in each row.", ["nature"]],
  [4, 5, "🥚", "Fill 4 rows of the egg tray with 5 in each row.", ["animals"]],
  [5, 3, "🪴", "Arrange 5 rows of pots with 3 in each row.", ["nature"]],
  [2, 6, "🧁", "Set out 2 rows of cakes with 6 in each row.", ["stories"]],
];
gradeOneArrays.forEach(([rows, columns, emoji, prompt, tags], index) => {
  add(
    "grade1", Math.min(3, index + 1),
    "MATH.G1.ADD.WITHIN20_01",
    "array-builder",
    prompt,
    `${rows},${columns}`,
    { kind: "array-builder", rows, columns, emoji, maxRows: 6, maxColumns: 7 },
    "Count one row, then add rows one at a time and watch the total climb by the same amount each time.",
    `${rows} rows of ${columns} is ${Array.from({ length: rows }, () => columns).join(" + ")} = ${rows * columns}. Adding the same number again and again is what multiplying will mean.`,
    tags,
  );
});

export const mathModelActivities = activities;
