import type { ArcadeGameId } from "./arcade";
import type { ContentBand, LearningBand } from "./learning-bands";

/**
 * What each game is *for*.
 *
 * Wave 09 requires every game to identify its target skill, learning objective, age
 * range and difficulty. The Game Zone previously carried a prose `skills` line — "Word
 * knowledge · blending · spelling" — which reads well and means nothing a parent can
 * check, nothing the recommender can use, and nothing that fails when it drifts.
 *
 * Two kinds of fact live here, deliberately separated:
 *
 *  - **Editorial.** The objective, the child-facing goal, and the how-to-play steps.
 *    These are written, not computed. The steps match what the engine actually does, so
 *    a child who asks "how do I play?" gets the real mechanic rather than a theme.
 *  - **Derived.** `skillIds` and `difficulty`, which come from the questions each game
 *    actually serves. They are restated here as literals rather than imported, because
 *    this module is used by client components and `lib/curriculum.ts` carries the answer
 *    key. `tests/game-design.test.mjs` recomputes both from the curriculum and fails if
 *    they have drifted, so the copy in the Game Zone cannot quietly become a lie.
 */

export type GameDesign = {
  /** For a grown-up. What this game is practising, in checkable terms. */
  objective: string;
  /** For the child. What they are trying to do, one sentence. */
  goal: string;
  /**
   * Replayable instructions, in order. Short enough to be read aloud to a
   * pre-reader, and describing the real interaction rather than the story wrapper.
   */
  howToPlay: string[];
  /** Skill graph ids this game exercises, per content pool. Derived; see above. */
  skillIds: Record<ContentBand, string[]>;
  /** Mean difficulty of those skills on the curriculum's 1–3 scale. Derived. */
  difficulty: Record<ContentBand, number>;
};

export const gameDesigns: Record<ArcadeGameId, GameDesign> = {
  robot: {
    objective:
      "Plan a sequence of moves before acting, then revise the plan when it does not work.",
    goal: "Get the robot to the star without bumping a rock.",
    howToPlay: [
      "Look at the map. Find the robot and find the star.",
      "Tap the arrows to build a plan. Each arrow moves one square.",
      "Press Run my plan to watch the robot follow it.",
      "If a rock stops the robot, undo a move and try a different way.",
    ],
    skillIds: { prek: ["LOGIC.PK.PLAN.ROUTE_01"], grade1: ["LOGIC.G1.PLAN.ROUTE_01"] },
    difficulty: { prek: 1.5, grade1: 2.5 },
  },
  kitchen: {
    objective:
      "Build and count quantities on a ten frame, moving from counting to adding and subtracting.",
    goal: "Fill the tray so every friend gets a snack.",
    howToPlay: [
      "Read how many snacks are needed.",
      "Tap an empty space to put a snack on the tray.",
      "Tap a snack again to take it off.",
      "When the tray looks right, press Serve my tray.",
    ],
    skillIds: {
      prek: ["MATH.PK.NUM.CARDINAL_01"],
      grade1: ["MATH.G1.ADD.WITHIN10_01", "MATH.G1.ADD.WITHIN20_01", "MATH.G1.SUB.WITHIN10_01"],
    },
    difficulty: { prek: 1.4, grade1: 2.65 },
  },
  words: {
    objective:
      "Match uppercase and lowercase letters, then build short words sound by sound.",
    goal: "Make the label that matches the picture.",
    howToPlay: [
      "Look at the picture and listen to the word.",
      "Choose letters from the tray to fill the empty spaces.",
      "Tap a letter you placed to put it back.",
      "When the word looks right, press Read my word.",
    ],
    skillIds: { prek: ["LIT.PK.ALPH.CASE_01"], grade1: ["LIT.G1.PH.CVC_01"] },
    difficulty: { prek: 1.6, grade1: 2 },
  },
  memory: {
    objective:
      "Hold a short sequence in working memory while something else is on screen, then reproduce it in order.",
    goal: "Load the carriages in the same order you saw.",
    howToPlay: [
      "Watch the order of the deliveries. Take as long as you like.",
      "Press I’m ready to hide them.",
      "Tap the pictures in the same order.",
      "You can clear your order and try again, or ask to see it once more.",
    ],
    skillIds: { prek: ["LOGIC.PK.MEMORY.TWO_01"], grade1: ["LOGIC.G1.MEMORY.THREE_01"] },
    difficulty: { prek: 1.5, grade1: 2.3 },
  },
  patterns: {
    objective:
      "Find the repeating group in a pattern and predict what comes next.",
    goal: "Work out which piece is missing from the garland.",
    howToPlay: [
      "Look along the garland and say it out loud.",
      "Listen for the part that repeats.",
      "Choose the piece that belongs where the question mark is.",
    ],
    skillIds: {
      prek: ["LOGIC.PK.PATTERN.AAB_01", "LOGIC.PK.PATTERN.ABB_01", "LOGIC.PK.PATTERN.AB_01"],
      grade1: ["LOGIC.PK.PATTERN.AAB_01", "LOGIC.PK.PATTERN.ABB_01", "LOGIC.PK.PATTERN.AB_01"],
    },
    difficulty: { prek: 1.73, grade1: 1.73 },
  },
  shapes: {
    objective:
      "Name flat shapes, then describe them by their sides and corners rather than by how they look.",
    goal: "Pair each shape with what describes it.",
    howToPlay: [
      "Choose a card on the left.",
      "Then choose its partner on the right.",
      "You can change a pair if you think again.",
      "When every card has a partner, press Check my pairs.",
    ],
    skillIds: {
      prek: ["MATH.PK.GEO.SHAPE_01"],
      grade1: ["MATH.G1.GEO.ATTRIBUTES_01", "MATH.PK.GEO.SHAPE_01"],
    },
    difficulty: { prek: 1.3, grade1: 1.6 },
  },
  steps: {
    objective:
      "Put the steps of a familiar activity in an order that would actually work.",
    goal: "Put the cards in the order things happen.",
    howToPlay: [
      "Look at all the cards first.",
      "Choose what happens first, then what happens next.",
      "Tap a card you placed to take it back.",
      "When the order looks right, check it.",
    ],
    skillIds: { prek: ["LOGIC.PK.SEQUENCE.ROUTINE_01"], grade1: ["LOGIC.G1.SEQUENCE.ROUTINE_01"] },
    difficulty: { prek: 1.7, grade1: 2.4 },
  },
  bubbles: {
    objective:
      "Hear beginning sounds and rhymes, then notice spelling patterns inside whole words.",
    goal: "Pop only the bubbles that follow the rule.",
    howToPlay: [
      "Listen to the rule. You can hear it again any time.",
      "Tap every bubble that fits it.",
      "Tap a bubble again to put it back.",
      "More than one bubble can be right.",
    ],
    skillIds: {
      prek: ["LIT.PK.PA.INITIAL_01", "LIT.PK.PA.RHYME_01"],
      grade1: ["LIT.G1.PH.CVC_01", "LIT.G1.PH.DIGRAPH_01", "LIT.G1.PH.LONG_VOWEL_01"],
    },
    difficulty: { prek: 1.25, grade1: 2.46 },
  },
  balance: {
    objective:
      "Compare quantities, then reason about what would make two sides equal.",
    goal: "Say which side of the scale tips down.",
    howToPlay: [
      "Look at what is on each side.",
      "Think about which side has more.",
      "Choose your answer, then watch the scale settle.",
    ],
    skillIds: {
      prek: ["MATH.PK.COMP.EQUAL_01", "MATH.PK.COMP.MORE_01"],
      grade1: ["MATH.G1.ADD.WITHIN10_01", "MATH.G1.PLACE.TENS_ONES_01", "MATH.G1.SUB.WITHIN10_01"],
    },
    difficulty: { prek: 1.83, grade1: 2.7 },
  },
  stars: {
    objective:
      "Follow counting order, then skip counting and number patterns, to reveal a picture.",
    goal: "Join the stars in the right order.",
    howToPlay: [
      "Find the star to start from.",
      "Tap the stars one at a time, in order.",
      "Watch the picture appear as the lines join up.",
    ],
    skillIds: {
      prek: ["LIT.PK.ALPH.NAME_01", "MATH.PK.NUM.RECITE_01"],
      grade1: ["LOGIC.G1.PATTERN.NUMBER_01", "MATH.G1.PLACE.TENS_ONES_01", "MATH.G1.SUB.WITHIN20_01"],
    },
    difficulty: { prek: 1.07, grade1: 2.93 },
  },
  stories: {
    objective:
      "Listen to a short story and answer from it — first what happened, then why it happened.",
    goal: "Listen carefully, then answer about the story.",
    howToPlay: [
      "Listen to the story, or read it yourself.",
      "You can hear it again before you answer.",
      "Think about what happened, then choose your answer.",
    ],
    skillIds: {
      prek: ["LIT.PK.COMP.RECALL_01"],
      grade1: ["LIT.G1.COMP.CAUSE_01", "LIT.G1.COMP.RECALL_01"],
    },
    difficulty: { prek: 1.5, grade1: 2.55 },
  },
};

export function gameDesign(id: ArcadeGameId) {
  return gameDesigns[id];
}

/**
 * How a game sits against a child's current band.
 *
 * `practice` is not a warning. A game below a child's band is worth offering as
 * confident, fluent practice, which is exactly what spaced review depends on — so this
 * describes a game's place rather than ranking it.
 */
export type GameFit = "practice" | "just-right" | "stretch";

/**
 * Half a difficulty step of tolerance on each side. Without it, a band whose range is a
 * single point (Early Preschool is [1, 1]) would mark almost everything a stretch, and
 * a three-year-old would be shown a playground of warnings.
 */
const TOLERANCE = 0.5;

export function gameFit(difficulty: number, band: Pick<LearningBand, "levelRange">): GameFit {
  const [low, high] = band.levelRange;
  if (difficulty < low - TOLERANCE) return "practice";
  if (difficulty > high + TOLERANCE) return "stretch";
  return "just-right";
}

/**
 * Wording is for the child. None of it implies being behind: "stretch" is framed as an
 * invitation, and nothing is locked on the strength of a fit.
 */
export function fitLabel(fit: GameFit): { label: string; note: string } {
  if (fit === "practice") return { label: "Warm-up", note: "Comfortable practice you can do quickly." };
  if (fit === "stretch") return { label: "A big stretch", note: "Tricky on purpose. Try it with a grown-up." };
  return { label: "Just right", note: "A good fit for you today." };
}

/** Difficulty as something a parent can read at a glance. */
export function difficultyLabel(difficulty: number): string {
  if (difficulty < 1.6) return "Gentle";
  if (difficulty < 2.3) return "Growing";
  return "Challenging";
}

/** Difficulty as dots, for a child who cannot yet read the label. */
export function difficultyDots(difficulty: number): number {
  return difficulty < 1.6 ? 1 : difficulty < 2.3 ? 2 : 3;
}
