import { resolveBand, type LearningBandId } from "./learning-bands";

/**
 * Copy rules for child surfaces.
 *
 * The rebuild blueprint (§C5) puts a hard ceiling on how much text may sit in front of a
 * child at one time: twelve words for ages 4–5, twenty-five for 6–7. That is a stricter
 * limit than `maxPromptWords` in `learning-bands.ts`, which describes how long a *prompt*
 * may be rather than how much text the screen may hold, so the two are combined and the
 * smaller of them wins.
 *
 * This is deliberately a plain function rather than a lint rule, because the text it has
 * to judge mostly arrives from the content catalogue at runtime, not from source.
 */

/** Words allowed on screen at once, from §C5. Not a style preference — a reading load. */
const ON_SCREEN_WORDS: Record<LearningBandId, number> = {
  "early-preschool": 8,
  prek: 12,
  kindergarten: 12,
  grade1: 25,
  // Outside the 4–7 audience (D1). They are never given a looser budget than the oldest
  // authored band, because more text on screen is not a reward for getting older.
  grade2: 25,
  grade3: 25,
};

export function wordBudget(band: LearningBandId): number {
  return Math.min(ON_SCREEN_WORDS[band], resolveBand(band).delivery.maxPromptWords);
}

export function countWords(text: string): number {
  const words = text.trim().match(/[^\s]+/g);
  return words ? words.length : 0;
}

/** True when a line is longer than the child in front of it can take in at once. */
export function overBudget(text: string, band: LearningBandId): boolean {
  return countWords(text) > wordBudget(band);
}

/**
 * Words a child surface may never show, whatever the band. These are the words the
 * product uses to talk to itself; §C5 keeps them out of the child's view. Nova says
 * "let's find the sounds", never "start your next activity".
 */
const SYSTEM_WORDS = [
  "activity",
  "activities",
  "session",
  "skill",
  "skills",
  "quest length",
  "mastery",
  "progress",
  "level",
  "score",
  "streak",
  "dashboard",
  "profile",
  "settings",
  "recommended",
];

/** The system words a line uses, so an authoring check can name them. */
export function systemWordsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return SYSTEM_WORDS.filter((word) => new RegExp(`\\b${word}\\b`).test(lower));
}

/**
 * Warns an author, in development only, when a line breaks a copy rule. A child never
 * sees this and production never pays for it; it exists so a long line is caught while
 * someone is looking at the screen rather than in a review months later.
 */
export function warnAboutCopy(where: string, text: string, band: LearningBandId): void {
  if (process.env.NODE_ENV === "production" || !text) return;
  const budget = wordBudget(band);
  if (countWords(text) > budget) {
    console.warn(
      `${where}: ${countWords(text)} words for band "${band}", over the ${budget}-word on-screen budget (§C5).`,
    );
  }
  const system = systemWordsIn(text);
  if (system.length) {
    console.warn(`${where}: child copy uses system words (${system.join(", ")}) — §C5.`);
  }
}
