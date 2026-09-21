import type { ErrorKind } from "@/lib/error-kinds";

/**
 * What the event stream can say that the blob never could (blueprint §WP-06.2–3).
 *
 * The aggregation happens in SQL, because it spans children and — for item health —
 * families. The *judgements* happen here, because they are product decisions with
 * thresholds somebody chose, and a threshold buried in plpgsql is a threshold nobody
 * revisits. Keeping them in TypeScript also means they are tested without a database.
 */

/** The §WP-06 threshold: one distractor taking more than this is a content bug. */
export const DOMINANT_DISTRACTOR_SHARE = 0.6;

/**
 * How many wrong answers an item needs before its shape means anything.
 *
 * Two children both picking `b` for `d` is a coincidence. The database applies this
 * floor too, but it is restated here so a fixture, an export or a future caller gets
 * the same answer — and so the number has one place to change.
 */
export const MIN_WRONG_ANSWERS = 5;

export type ItemHealth = {
  itemId: string;
  skillId: string;
  prompt: string | null;
  reviewStatus: string | null;
  attempts: number;
  correct: number;
  wrong: number;
  topDistractor: string;
  topPicks: number;
  /** The dominant distractor's share of all wrong answers, 0–1. */
  share: number;
  errorKind: ErrorKind | null;
  /** Whether a person chose that distractor's reason, rather than the inference. */
  reviewed: boolean;
};

export type ItemVerdict = {
  /** `rewrite` is the §WP-06 flag. The others are context, not alarms. */
  kind: "rewrite" | "watch" | "healthy";
  /** One sentence, ready to show an author. */
  sentence: string;
};

/**
 * What to do about an item, in words.
 *
 * Three distinctions the raw percentage cannot make on its own:
 *
 *   * a dominant distractor **with** an authored reason is a teaching problem — the
 *     misconception is known and the lesson is not addressing it;
 *   * a dominant distractor **without** one is an authoring problem — nobody has yet
 *     said why children pick it, so the teaching move they get is guesswork;
 *   * an item almost nobody gets right is a different fault from one where the wrong
 *     answers merely cluster, and saying "rewrite the distractor" about it would send
 *     an author to fix the wrong half of the item.
 */
export function itemVerdict(item: ItemHealth): ItemVerdict {
  const share = Math.round(item.share * 100);
  const accuracy = item.attempts ? item.correct / item.attempts : 0;

  if (item.wrong < MIN_WRONG_ANSWERS) {
    return { kind: "healthy", sentence: `Only ${item.wrong} wrong answers so far — too few to judge.` };
  }

  if (item.attempts >= MIN_WRONG_ANSWERS * 2 && accuracy < 0.25) {
    return {
      kind: "rewrite",
      sentence: `Only ${Math.round(accuracy * 100)}% of children get this right. The prompt or the lesson before it is the problem, not the wrong answers.`,
    };
  }

  if (item.share > DOMINANT_DISTRACTOR_SHARE) {
    return item.errorKind && item.reviewed
      ? {
          kind: "rewrite",
          sentence: `${share}% of wrong answers are “${item.topDistractor}”, and somebody already recorded why: ${item.errorKind}. The lesson is not addressing that misconception.`,
        }
      : {
          kind: "rewrite",
          sentence: `${share}% of wrong answers are “${item.topDistractor}”, and no one has said why children pick it. Until somebody does, the teaching move they get is a guess.`,
        };
  }

  if (item.share > DOMINANT_DISTRACTOR_SHARE - 0.15) {
    return { kind: "watch", sentence: `“${item.topDistractor}” takes ${share}% of wrong answers — close to the line.` };
  }

  return { kind: "healthy", sentence: `Wrong answers are spread across the choices (${share}% on the largest).` };
}

/** Items §WP-06 says to flag, worst first. */
export function needsRewrite(items: readonly ItemHealth[]): ItemHealth[] {
  return items.filter((item) => itemVerdict(item).kind === "rewrite").sort((a, b) => b.share - a.share);
}

export type RetentionWindow = {
  skillId: string;
  childId: string;
  learnedAt: string;
  revisitedAt: string;
};

export type Retention = {
  days: number;
  /** Skills with at least one correct attempt. */
  skillsLearned: number;
  /** Of those, the ones actually met again `days` or more later. */
  skillsRevisited: number;
  skillsRetained: number;
  /** Null until something has been revisited. A rate over zero skills is not zero. */
  rate: number | null;
  slipped: RetentionWindow[];
  held: RetentionWindow[];
  /** Learnt, but not yet revisited this late. Work the scheduler still owes. */
  awaiting: number;
};

export function emptyRetention(days = 14): Retention {
  return { days, skillsLearned: 0, skillsRevisited: 0, skillsRetained: 0, rate: null, slipped: [], held: [], awaiting: 0 };
}

/**
 * Retention as a sentence a parent can act on.
 *
 * Never a bare percentage. A number with no denominator invites a parent to read 50%
 * as a grade when it means one skill of two, and §D5 is explicit that a practice
 * signal must not be dressed as an assessment.
 */
export function describeRetention(retention: Retention, name: string): string {
  if (retention.skillsRevisited === 0) {
    return retention.skillsLearned === 0
      ? `${name} has not practised anything yet.`
      : `${name} has ${retention.skillsLearned} skill${retention.skillsLearned === 1 ? "" : "s"} waiting to be met again after ${retention.days} days. Nothing has come round yet.`;
  }
  const { skillsRetained: held, skillsRevisited: seen } = retention;
  if (held === seen) {
    return `Everything ${name} has met again after ${retention.days} days — ${seen} skill${seen === 1 ? "" : "s"} — was still there.`;
  }
  return `Of ${seen} skill${seen === 1 ? "" : "s"} ${name} met again after ${retention.days} days, ${held} ${held === 1 ? "was" : "were"} still there and ${seen - held} needed another look.`;
}
