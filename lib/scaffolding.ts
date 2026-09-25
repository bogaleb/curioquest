import type { LearningBand } from "./learning-bands";

/**
 * What the guide does when a child keeps getting the same activity wrong.
 *
 * Before this, nothing. `session.misses` was incremented and never read. A child could
 * answer the same question wrong five times and receive the identical sentence each
 * time — the authored level-one hint — while the three-level scaffolding ladder in
 * `lib/nova.ts` sat unused unless the child knew to press "give me a hint". The children
 * least likely to press it are the ones who most need it.
 *
 * `COMMERCIAL-UPGRADE.md` asks for scaffolding, worked examples, and gradual release of
 * responsibility. Wave 04 states the rule directly: on repeated struggle, increase
 * scaffolding and add worked examples. This is that rule, as a pure function.
 *
 * ## Why this does not undermine the independence signal
 *
 * The audit records a deliberate decision: Nova offers help after a pause rather than
 * taking it, because a child who is merely thinking has not asked for help and marking
 * them as helped would understate their independence. That reasoning is about *pauses*.
 * A wrong answer is different evidence — it has already happened.
 *
 * It is also already priced in. `recordAttempt` is called only when `misses === 0`, so
 * skill evidence is captured from the first attempt and nothing offered afterwards can
 * change it. What escalating help does affect is the help count a parent sees, and that
 * should go up: help offered is still help used.
 */

export type ScaffoldLevel = 0 | 1 | 2 | 3;

/**
 * Misses required before the ladder advances, by band maturity.
 *
 * Level 1 (the authored hint) has always arrived on the first wrong answer and still
 * does. These are the thresholds for level 2 (a strategy to try) and level 3 (the worked
 * explanation).
 *
 * Older bands wait longer on purpose. Productive struggle is a learning principle, not
 * an oversight, and a seven-year-old who is shown the reasoning after two wrong answers
 * never gets to find it. Younger bands wait less, because a four-year-old who is stuck
 * twice is not about to have a breakthrough on the third go — they are about to give up.
 */
function thresholds(band: Pick<LearningBand, "stage">): { strategy: number; worked: number } {
  if (band.stage <= 1) return { strategy: 2, worked: 3 };
  if (band.stage <= 3) return { strategy: 3, worked: 4 };
  return { strategy: 3, worked: 5 };
}

/**
 * The support level owed after `misses` wrong answers on the current activity.
 *
 * `misses` is the count *including* the answer just given, so the first wrong answer is
 * `misses === 1`.
 */
export function scaffoldForMisses(misses: number, band: Pick<LearningBand, "stage">): ScaffoldLevel {
  if (misses <= 0) return 0;
  const { strategy, worked } = thresholds(band);
  if (misses >= worked) return 3;
  if (misses >= strategy) return 2;
  return 1;
}

/**
 * Whether the ladder should advance, given help already given on this activity.
 *
 * A child who asked for help has already been moved up the ladder; automatic support
 * must never move them back down, and must never re-record help it has already counted.
 * Returns `null` when nothing new is owed.
 */
export function nextScaffold(
  misses: number,
  currentLevel: number,
  band: Pick<LearningBand, "stage">,
): ScaffoldLevel | null {
  const owed = scaffoldForMisses(misses, band);
  return owed > currentLevel ? owed : null;
}

/**
 * How the guide introduces help the child did not ask for.
 *
 * Phrased so that being stuck reads as an ordinary part of learning rather than as a
 * verdict, and so that the child is still the one who answers. None of these say "the
 * answer is".
 */
export function assistedIntro(level: ScaffoldLevel): string {
  if (level >= 3) return "Let’s work through this one together.";
  if (level === 2) return "Here’s a way to try it.";
  return "Here’s a clue.";
}
