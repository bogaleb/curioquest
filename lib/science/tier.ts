import { bandById, type LearningBandId } from "@/lib/learning-bands";
import { labTiers, type ByTier, type LabTier } from "./types";

/**
 * Authoring helpers for tiered copy, and the one place a band becomes a tier.
 *
 * `ByTier` requires all three voices to exist. That is deliberate — a station written
 * only for seven-year-olds is a station a four-year-old should not be offered — but a
 * noun is a noun, and making an author type "Cork" three times produces worse content,
 * not better, because it buries the sentences that genuinely differ inside a wall of
 * repetition.
 *
 * So: `t3` when the three voices differ, `t2` when the two younger ones share, `one`
 * when it is a label. Anything that teaches — a question, an observation, an
 * explanation, a notebook prompt — uses `t3` or `t2` and is checked for it in the tests.
 */

/** All three voices, written out. Used for everything that teaches. */
export function t3<T>(explorer: T, investigator: T, scientist: T): ByTier<T> {
  return { explorer, investigator, scientist };
}

/** Two voices: the younger children share a sentence, the oldest gets their own. */
export function t2<T>(younger: T, scientist: T): ByTier<T> {
  return { explorer: younger, investigator: younger, scientist };
}

/** One value for everyone. For names of things, never for sentences that teach. */
export function one<T>(value: T): ByTier<T> {
  return { explorer: value, investigator: value, scientist: value };
}

/**
 * Which voice this child is owed.
 *
 * The split is by what a true answer may contain, not by reading age:
 *
 *   explorer      3–5   before a child can hold a comparison in mind
 *   investigator  5–7   once "the same except for one thing" means something
 *   scientist     7–9   once "why" is a question about mechanism, not about rules
 *
 * A band that arrives unknown resolves to `investigator` rather than to the youngest
 * voice. Talking down to a child who can read is a worse failure than the reverse: the
 * younger child has audio, pictures and an adult, and the older one has only the
 * feeling that this app thinks they are small.
 */
export function tierForBand(band: LearningBandId | undefined): LabTier {
  const stage = band ? bandById.get(band)?.stage : undefined;
  if (stage === undefined) return "investigator";
  if (stage <= 1) return "explorer";      // early-preschool, prek
  if (stage <= 3) return "investigator";  // kindergarten, grade1
  return "scientist";                     // grade2, grade3
}

/** Resolve one piece of tiered copy. */
export function say<T>(copy: ByTier<T>, tier: LabTier): T {
  return copy[tier];
}

export function isLabTier(value: unknown): value is LabTier {
  return typeof value === "string" && (labTiers as string[]).includes(value);
}
