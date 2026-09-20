import type { ActivityEngine } from "./activity-types";
import type { LearningBand } from "./learning-bands";
import { skillById } from "./skill-graph";

/**
 * The shape of a game mission: rounds, a difficulty ramp, and a scoring arc.
 *
 * Eleven games run on eleven real interaction engines, and Wave 09's controls and
 * educational metadata landed earlier. What stayed missing was the loop itself. A
 * mission was four questions served in authored order, one at a time, ending in a flat
 * `questions.length * 2` stars — the same reward whether a child solved every one first
 * try or ground through all four with help. There was no round structure, nothing got
 * harder as a child got further, and nothing about the mission's shape was legible while
 * playing it. "Answer four questions" is a quiz with an engine attached, which is the
 * one thing the wave's own principle forbids.
 *
 * Everything here is a pure function over data the session already carries, so the loop
 * is testable without a browser and behaves identically on the server and in the player.
 *
 * This module is imported by client components. It must never import `lib/curriculum.ts`,
 * which carries the answer key — hence the structural `RampQuestion` below rather than
 * `Question`. `scripts/check-bundle.mjs` is the backstop.
 */

/** Just enough of a question to judge how hard it will feel. */
export type RampQuestion = { id: string; skillId: string; engine?: ActivityEngine; options?: string[] };

/**
 * How much work an engine puts in front of a child, on a rough common scale.
 *
 * Skill difficulty is the better signal, but it is coarse: a whole mission of Robot
 * Commander is one skill, so skill difficulty alone cannot tell a two-move delivery from
 * a six-move one through a field of rocks. The engine spec can, because the thing that
 * makes a route hard is literally in it. Each case counts the elements a child has to
 * hold at once — squares to cross, letters to place, cards to pair, beats to remember.
 */
export function engineLoad(engine: ActivityEngine | undefined, options?: string[]): number {
  if (!engine) return options?.length ?? 0;
  switch (engine.kind) {
    case "counting": return engine.max;
    case "sorting": return engine.items.length + engine.bins.length;
    case "memory": return engine.sequence.length * 2;
    case "word-builder": return engine.length + engine.letters.length;
    case "pattern": return engine.sequence.length;
    case "ten-frame": return engine.size;
    case "route": return engine.maxMoves + engine.rocks.length;
    case "matching": return engine.items.length + engine.targets.length;
    case "ordering": return engine.items.length;
    case "bubble-pop": return engine.bubbles.length;
    case "balance": return engine.left.count + engine.right.count;
    case "constellation": return engine.stars.length;
    default: return options?.length ?? 0;
  }
}

/**
 * Where a question sits on the mission's ramp. Lower is a gentler start.
 *
 * Skill difficulty leads, because subtraction is a harder idea than addition however few
 * counters it uses. Engine load breaks ties within a skill. The weighting keeps the two
 * on speaking terms: skill difficulty runs 1–3, so a step up in skill outranks any
 * plausible difference in engine load.
 */
export function rampWeight(question: RampQuestion): number {
  const difficulty = skillById.get(question.skillId)?.difficulty ?? 2;
  return difficulty * 100 + engineLoad(question.engine, question.options);
}

/**
 * The mission's questions, gentlest first.
 *
 * Gradual release of responsibility, applied inside a single sitting: the first thing a
 * child meets should be the thing they are most likely to get right, because a mission
 * that opens with its hardest question teaches them that this game is not for them.
 *
 * The sort is stable, so questions of equal weight keep their authored order. Where a
 * mission's questions genuinely are all the same difficulty this changes nothing, which
 * is the correct outcome rather than a shuffle for its own sake.
 */
export function rampOrder<T extends RampQuestion>(questions: T[]): T[] {
  return questions
    .map((question, index) => ({ question, index, weight: rampWeight(question) }))
    .sort((a, b) => a.weight - b.weight || a.index - b.index)
    .map((entry) => entry.question);
}

/**
 * The longest stretch of questions a band should meet without a pause.
 *
 * Wave 09 asks for shorter rounds for younger children. This is that, and it is the
 * reason rounds exist at all: a four-year-old asked for sustained attention across a
 * whole mission runs out of it before the mission does, and the thing that breaks is
 * usually their sense that they are good at this.
 */
export function roundLength(band: Pick<LearningBand, "stage">): number {
  if (band.stage <= 1) return 2;
  if (band.stage <= 3) return 3;
  return 4;
}

/**
 * Mission questions grouped into rounds, as a list of round sizes.
 *
 * Rounds are evened out rather than packed: a mission of four at a round length of three
 * becomes 2 + 2, not 3 + 1, because a final round of one question is a straggler, not a
 * round. Today every mission is four questions long, so the oldest two bands play one
 * continuous round and the younger four get a breather at the halfway mark. The function
 * is written for the general case so longer missions will not need it rewritten.
 */
export function roundSizes(total: number, band: Pick<LearningBand, "stage">): number[] {
  if (total <= 0) return [];
  const count = Math.max(1, Math.ceil(total / roundLength(band)));
  const base = Math.floor(total / count);
  const extra = total % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

export type RoundPosition = {
  /** 1-based round the child is in. */
  round: number;
  /** How many rounds this mission has. */
  rounds: number;
  /** 1-based position within the round. */
  step: number;
  /** How many questions this round holds. */
  steps: number;
  /** True when this question ends a round that is not the last one. */
  roundEnd: boolean;
};

/**
 * Which round a zero-based question index falls in.
 *
 * `roundEnd` marks the last question of a non-final round, so the player can mark the
 * end of a round at the moment it happens rather than a question late.
 */
export function roundPosition(index: number, total: number, band: Pick<LearningBand, "stage">): RoundPosition {
  const sizes = roundSizes(total, band);
  if (!sizes.length) return { round: 1, rounds: 1, step: 1, steps: 0, roundEnd: false };
  let start = 0;
  for (let round = 0; round < sizes.length; round++) {
    const size = sizes[round];
    const last = round === sizes.length - 1;
    if (index < start + size || last) {
      const step = Math.max(1, Math.min(index - start + 1, size));
      return { round: round + 1, rounds: sizes.length, step, steps: size, roundEnd: step === size && !last };
    }
    start += size;
  }
  return { round: 1, rounds: 1, step: 1, steps: total, roundEnd: false };
}

/** The running arc of a mission. Stored on the session; sanitised on read. */
export type MissionArc = {
  /** Points earned so far. Every finished question is worth at least one. */
  points: number;
  /** Questions solved first try with no help. */
  clean: number;
  /** Current run of clean answers. */
  streak: number;
  /** Longest run of clean answers this mission. */
  bestStreak: number;
};

export const EMPTY_ARC: MissionArc = { points: 0, clean: 0, streak: 0, bestStreak: 0 };

/**
 * Read an arc off a stored session without trusting its shape.
 *
 * Sessions are persisted and come back from the database, so this coerces the same way
 * `normalizeArcade` does rather than assuming the stored object is the one we wrote.
 */
export function readArc(value: unknown): MissionArc {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...EMPTY_ARC };
  const raw = value as Record<string, unknown>;
  const whole = (key: string) => Math.max(0, Math.floor(Number(raw[key]) || 0));
  const streak = whole("streak");
  return { points: whole("points"), clean: whole("clean"), streak, bestStreak: Math.max(whole("bestStreak"), streak) };
}

/** What a single solved question was worth. */
export type AnswerQuality = "clean" | "supported" | "persevered";

/**
 * How a solved question is graded.
 *
 * Solving it alone and first time is worth most. Taking help is worth less than not
 * needing it and more than nothing, because asking for help is a skill we want children
 * to use. Getting there after wrong answers still scores, because persistence is the
 * behaviour this product most wants to see and a zero would tell a child their effort
 * was worthless.
 */
export function answerQuality(misses: number, helpLevel: number): AnswerQuality {
  if (misses > 0) return "persevered";
  return helpLevel > 0 ? "supported" : "clean";
}

export function pointsFor(quality: AnswerQuality): number {
  return quality === "clean" ? 3 : quality === "supported" ? 2 : 1;
}

/** Fold a solved question into the arc. */
export function scoreAnswer(arc: MissionArc, misses: number, helpLevel: number): MissionArc {
  const quality = answerQuality(misses, helpLevel);
  const streak = quality === "clean" ? arc.streak + 1 : 0;
  return {
    points: arc.points + pointsFor(quality),
    clean: arc.clean + (quality === "clean" ? 1 : 0),
    streak,
    bestStreak: Math.max(arc.bestStreak, streak),
  };
}

/**
 * Stars for finishing a mission: the old flat award, plus what the arc earned.
 *
 * The base is deliberately unchanged at `total * 2`. A child who struggles through a
 * mission takes home exactly what they would have before this loop existed — the
 * scoring arc can only ever add. Tying the existing reward to performance would have
 * made every hard-won mission pay less than it used to, which is a strange lesson for a
 * product whose whole premise is that trying again is the point.
 *
 * On top of that: a star for each question solved cleanly, and two more for carrying a
 * clean streak from the first question to the last.
 */
export function missionStars(arc: MissionArc, total: number): number {
  if (total <= 0) return 0;
  return total * 2 + arc.clean + (arc.bestStreak >= total ? 2 : 0);
}

/**
 * What the child is told they achieved. Never a failing grade: the worst outcome
 * available names what they actually did, which was finish.
 */
export function missionRank(arc: MissionArc, total: number): { label: string; note: string } {
  if (total > 0 && arc.clean >= total) return { label: "Perfect run", note: "Every one, first try." };
  if (arc.bestStreak >= 3) return { label: "On a roll", note: `${arc.bestStreak} in a row without a stumble.` };
  if (total > 0 && arc.clean * 2 >= total) return { label: "Strong run", note: `${arc.clean} solved first try.` };
  return { label: "Mission complete", note: "You stayed with it to the end." };
}
