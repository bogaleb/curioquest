import type { Question } from "@/lib/curriculum";
import type { ErrorKind } from "@/lib/error-kinds";
import { isErrorKind } from "@/lib/error-kinds";

/**
 * Why this particular wrong answer was wrong.
 *
 * The blueprint calls authored distractor reasons "the single highest-leverage
 * pedagogical upgrade available", and it is right, but authoring ~1,400 items by hand
 * is WP-05's job. WP-04 allows a mechanical first pass, and this is it: given the
 * question and what the child chose, infer the misconception from the shape of the two.
 *
 * Precedence is deliberate. An authored reason always wins, because a human who wrote
 * the distractor knows why they wrote it. The inference below runs only where nobody
 * has said. Everything it produces is a hypothesis, and `reviewStatus: draft` on the
 * item is how the catalogue remembers that.
 */

/** Letters a child confuses by shape. Symmetric: order of the pair does not matter. */
const visualPairs = [
  ["b", "d"], ["p", "q"], ["b", "p"], ["d", "q"], ["m", "w"], ["n", "u"],
  ["i", "l"], ["g", "q"], ["6", "9"], ["2", "5"], ["s", "z"],
];

/** Sounds a child confuses by ear. Place or manner of articulation is close. */
const soundPairs = [
  ["m", "n"], ["f", "th"], ["f", "v"], ["b", "p"], ["d", "t"], ["k", "g"],
  ["s", "z"], ["sh", "ch"], ["ch", "j"], ["v", "w"], ["l", "r"], ["e", "i"],
  ["a", "u"], ["o", "u"],
];

/** What a child says when they give the letter's name where its sound was asked for. */
const letterNames: Record<string, string> = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "ef", g: "jee", h: "aitch",
  i: "eye", j: "jay", k: "kay", l: "el", m: "em", n: "en", o: "oh", p: "pee",
  q: "cue", r: "ar", s: "ess", t: "tee", u: "you", v: "vee", w: "double-u",
  x: "ex", y: "why", z: "zed",
};

function pairMatches(pairs: string[][], a: string, b: string) {
  return pairs.some(([left, right]) =>
    (left === a && right === b) || (left === b && right === a));
}

/**
 * How fast an answer has to arrive before it reads as a tap rather than a decision.
 *
 * Deliberately low. A child who thinks quickly and is right is not guessing, and a
 * child who is merely quick and wrong should not be excused from the evidence — `guess`
 * does not count against mastery, so setting this too high would let real
 * misconceptions go unrecorded and unaddressed.
 */
const GUESS_LATENCY_MS = 900;

export type ClassifyInput = {
  question: Pick<Question, "answer" | "options" | "activityType" | "engine" | "skillId">;
  response: string;
  latencyMs?: number | null;
  /** True when the child has not yet met this skill's prerequisites. */
  prerequisiteMissing?: boolean;
  /** The reason an author attached to this distractor, if any. Always wins. */
  authored?: ReadonlyArray<{ value: string; errorKind: ErrorKind }>;
};

export function errorKindFor(input: ClassifyInput): ErrorKind | null {
  const { question, response } = input;
  const answer = String(question.answer ?? "");
  if (!response || response === answer) return null;

  // An author's reason always wins over an inference about the same distractor.
  const authored = input.authored?.find((entry) => entry.value === response);
  if (authored && isErrorKind(authored.errorKind)) return authored.errorKind;

  // A prerequisite gap is the product's mistake, not the child's, and it routes
  // backwards rather than scoring. It outranks every shape-based guess below,
  // because a child who was never taught the idea cannot be confusing two of them.
  if (input.prerequisiteMissing) return "not-yet-taught";

  const chosen = response.trim().toLowerCase();
  const target = answer.trim().toLowerCase();

  // The letter's name where its sound was wanted. Checked before the sound pairs,
  // because "em" for /m/ is a different mistake from "n" for /m/ and needs a
  // different move: it is a child who knows the alphabet song, not one who mishears.
  if (letterNames[target] === chosen || (chosen.length > 1 && letterNames[target[0]] === chosen)) {
    return "letter-name-for-sound";
  }

  if (chosen.length <= 2 && target.length <= 2) {
    // Visual first for a letter shown on screen, aural first for a sound played aloud.
    const heard = question.activityType === "sound-choice";
    if (heard && pairMatches(soundPairs, chosen, target)) return "confusable-sound";
    if (pairMatches(visualPairs, chosen, target)) return "confusable-visual";
    if (pairMatches(soundPairs, chosen, target)) return "confusable-sound";
  }

  // A counting slip. The child has the idea and lost the count, which is the one
  // wrong answer that calls for slowing down rather than re-teaching.
  const chosenNumber = Number(chosen);
  const targetNumber = Number(target);
  if (Number.isFinite(chosenNumber) && Number.isFinite(targetNumber)
      && Math.abs(chosenNumber - targetNumber) === 1) {
    return "off-by-one";
  }

  const engine = question.engine;
  if (engine) {
    // Right pieces, wrong order: the child knows the parts and not the sequence.
    if (engine.kind === "ordering" || engine.kind === "constellation" || engine.kind === "memory") {
      const parsed = parseArray(response);
      const solution = engine.kind === "memory" ? engine.sequence : engine.solution;
      if (parsed && solution && sameMembers(parsed, solution)) return "sequence-reversed";
    }
    // Sorted consistently, by the wrong property. A child who put every item in one
    // bin was not sorting by an attribute at all, so that is left unclassified.
    if (engine.kind === "sorting" || engine.kind === "matching") {
      const parsed = parseObject(response);
      if (parsed && engine.solution) {
        const placements = Object.values(parsed);
        const wrong = Object.entries(parsed).filter(([id, bin]) => engine.solution![id] !== bin);
        if (wrong.length >= 2 && new Set(placements).size > 1) return "wrong-attribute";
      }
    }
    if (engine.kind === "bubble-pop") {
      const parsed = parseArray(response);
      if (parsed && engine.solution && parsed.length && !parsed.some((id) => engine.solution!.includes(id))) {
        return "wrong-attribute";
      }
    }
  }

  // Checked last. Everything above is a specific, teachable misconception, and calling
  // one of those a guess because the child answered quickly would throw away the one
  // piece of information worth having.
  if (typeof input.latencyMs === "number" && input.latencyMs > 0 && input.latencyMs < GUESS_LATENCY_MS) {
    return "guess";
  }
  return null;
}

function parseArray(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? (parsed as string[]) : null;
  } catch { return null; }
}

function parseObject(value: string): Record<string, string> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, unknown>);
    return entries.every(([, item]) => typeof item === "string")
      ? Object.fromEntries(entries as [string, string][]) : null;
  } catch { return null; }
}

function sameMembers(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

/**
 * Translate the reading slice's own error taxonomy into the shared §C3 vocabulary.
 *
 * `classifyReadingError` predates the blueprint and is more specific than §C3 in the
 * places that matter for phonics — it can tell an initial-phoneme slip from a final one.
 * That detail is kept in `ReadingAttempt.errorType` and is what the reading engine
 * teaches from. This is the coarser shared name, so that the event stream, the parent
 * report and item health can ask one question across reading and everything else.
 *
 * Where no §C3 kind honestly fits, this returns null rather than forcing one. A wrong
 * label is worse than no label: it would send the feedback engine to the wrong move.
 */
export function errorKindForReading(input: {
  errorType: string | null;
  kind: string;
  target: string;
  response: string;
}): ErrorKind | null {
  const { errorType } = input;
  if (!errorType) return null;
  const target = input.target.trim().toLowerCase();
  const response = input.response.trim().toLowerCase();

  if (errorType === "letter_sound_confusion") {
    // Letter Catch plays a sound and shows letters, so both mistakes are possible.
    // The letter's name is the give-away that this is alphabet-song knowledge
    // standing in for phonics, which needs a different correction from either.
    if (letterNames[target] === response) return "letter-name-for-sound";
    if (pairMatches(visualPairs, response, target)) return "confusable-visual";
    return "confusable-sound";
  }
  if (errorType === "initial_phoneme_confusion"
      || errorType === "final_phoneme_confusion"
      || errorType === "vowel_confusion") {
    return "confusable-sound";
  }
  if (errorType === "sound_sequence_confusion") {
    // Same sounds, wrong order — the child has every phoneme and blended them the
    // wrong way round, which is a sequencing problem, not a hearing one.
    return sameMembers([...target], [...response]) ? "sequence-reversed" : "confusable-sound";
  }
  // sound_sequence_incomplete (a missing phoneme), story_detail_confusion (a
  // comprehension miss) and needed_support (a skip) have no honest §C3 equivalent.
  return null;
}
