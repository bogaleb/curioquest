/**
 * Why a wrong answer was wrong (blueprint §C3).
 *
 * A child who picks `b` for `d` has a reversal problem. A child who picks `m` has not
 * heard the sound. Same wrong-answer count, completely different teaching response —
 * and today both produce the same sentence. Every authored distractor carries one of
 * these, and feedback, hint selection and the next item all branch on it.
 *
 * This is a content-authoring discipline more than a code change, which is why the
 * type is small and the vocabulary is closed: an author choosing from eight named
 * misconceptions writes better distractors than one writing free text.
 */
export type ErrorKind =
  | "confusable-visual"      // b/d, p/q, 6/9 — the shapes, not the sounds
  | "confusable-sound"       // m/n, f/th — heard wrong, not seen wrong
  | "letter-name-for-sound"  // says "em" where /m/ is meant
  | "off-by-one"             // a counting slip, not a misunderstanding of counting
  | "wrong-attribute"        // sorted by colour when asked for shape
  | "sequence-reversed"      // right parts, wrong order
  | "guess"                  // fast, low-confidence tap
  | "not-yet-taught";        // a prerequisite gap, not a failure

export const errorKinds: ErrorKind[] = [
  "confusable-visual",
  "confusable-sound",
  "letter-name-for-sound",
  "off-by-one",
  "wrong-attribute",
  "sequence-reversed",
  "guess",
  "not-yet-taught",
];

const known = new Set<string>(errorKinds);
export function isErrorKind(value: unknown): value is ErrorKind {
  return typeof value === "string" && known.has(value);
}

/**
 * Error kinds that must never lower a mastery score.
 *
 * A child who has not met the prerequisite has not failed the skill — they were asked
 * the wrong question, which is the product's mistake and not theirs. A fast tap with no
 * thought behind it is noise rather than evidence of misunderstanding. Scoring either
 * one teaches the model something untrue and teaches the child that being asked
 * something they were never shown counts against them.
 */
const unscored = new Set<ErrorKind>(["not-yet-taught", "guess"]);
export function scoresAgainstMastery(kind: ErrorKind | null | undefined) {
  return !kind || !unscored.has(kind);
}

/**
 * Whether a wrong answer should send the child backwards to a prerequisite rather than
 * re-presenting the same idea with more help.
 */
export function triggersPrerequisiteDetour(kind: ErrorKind | null | undefined) {
  return kind === "not-yet-taught";
}

/**
 * The teaching move each misconception deserves.
 *
 * Not a message — a *move*. `compare` puts the two confusable letters side by side;
 * `relisten` replays the sound without showing anything; `recount` slows the count down
 * and touches each object; `restate-rule` says the sorting rule again before the child
 * tries; `reorder` keeps the pieces and asks only about their order; `settle` gives a
 * beat before the next try, because the answer was fast rather than wrong-headed;
 * `step-back` routes to the prerequisite.
 */
export type TeachingMove =
  | "compare"
  | "relisten"
  | "sound-not-name"
  | "recount"
  | "restate-rule"
  | "reorder"
  | "settle"
  | "step-back";

const moves: Record<ErrorKind, TeachingMove> = {
  "confusable-visual": "compare",
  "confusable-sound": "relisten",
  "letter-name-for-sound": "sound-not-name",
  "off-by-one": "recount",
  "wrong-attribute": "restate-rule",
  "sequence-reversed": "reorder",
  guess: "settle",
  "not-yet-taught": "step-back",
};

export function teachingMove(kind: ErrorKind | null | undefined): TeachingMove | null {
  return kind ? moves[kind] : null;
}
