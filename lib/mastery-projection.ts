import { skillById } from "@/lib/skill-graph";
import { scoresAgainstMastery } from "@/lib/error-kinds";
import {
  EVIDENCE_THRESHOLDS, masteryState, meetsIndependence, meetsRepresentation, meetsSpacing,
} from "@/lib/evidence-rule";
import type { LearningVerb, SupportLevel } from "@/lib/learning-events";
import type { ActivityType } from "@/lib/curriculum";
import { emptyMastery, type SkillMastery, type SkillMasteryMap } from "@/lib/mastery";

/**
 * Mastery as a projection over the event stream (blueprint §C2, D5).
 *
 * The JSON blob on `explorer_state` is a running total mutated in place: it cannot be
 * recomputed, audited, or corrected, and a scoring bug baked into it is permanent. This
 * folds the same numbers out of `learning_events`, so the blob demotes to a cache that
 * can be thrown away and rebuilt.
 *
 * It deliberately reproduces `recordAttempt`'s arithmetic rather than improving on it.
 * WP-01 is about moving where the numbers come from; changing what they are at the same
 * time would make the two impossible to compare, and the test that the projection
 * matches the blob is the only evidence that the move was faithful.
 */

/** The minimum shape the projection needs. Both the DB row and a test fixture fit it. */
export type ProjectionEvent = {
  sessionId: string;
  occurredAt: string;
  skillId: string;
  itemId: string;
  verb: LearningVerb;
  correct: boolean;
  support: SupportLevel;
  errorKind?: string | null;
  /**
   * The engine the item used, when known. `recordAttempt` counted representation
   * variety by engine kind, and the projection has to count the same thing to match.
   */
  activityKind?: string | null;
  contextTags?: readonly string[];
};

/** Map a database row onto the projection's input shape. */
export function eventFromRow(row: {
  session_id: string; occurred_at: string; skill_id: string; item_id: string;
  verb: LearningVerb; correct: boolean; support: SupportLevel; error_kind: string | null;
}): ProjectionEvent {
  return {
    sessionId: row.session_id,
    occurredAt: row.occurred_at,
    skillId: row.skill_id,
    itemId: row.item_id,
    verb: row.verb,
    correct: row.correct,
    support: row.support,
    errorKind: row.error_kind,
  };
}

const DAY_MS = EVIDENCE_THRESHOLDS.spacingHours * 60 * 60 * 1000;

/**
 * The three kinds of evidence a skill needs before it may be called mastered.
 *
 * This is the whole commercial argument of the rethink expressed as a type. It is what
 * lets a parent report say "Maya can blend three-sound words on her own, a week after
 * she learned it" instead of "Maya completed 42 activities" — and what stops the product
 * claiming the first when it has only measured the second.
 */
export type Evidence = {
  /** Correct in at least two different verbs. */
  representation: { verbs: LearningVerb[]; met: boolean };
  /** At least one correct attempt 24h or more after the first correct attempt. */
  spacing: { firstCorrectAt: string | null; spacedCorrectAt: string | null; met: boolean };
  /** At least two consecutive correct attempts with no support standing. */
  independence: { consecutive: number; met: boolean };
};

export type SkillEvidence = SkillMastery & {
  evidence: Evidence;
  /** `mastered` only when all three hold. Everything short of it is practice. */
  state: "untouched" | "practising" | "mastered";
};

export type SkillEvidenceMap = Record<string, SkillEvidence>;

function emptyEvidence(): Evidence {
  return {
    representation: { verbs: [], met: false },
    spacing: { firstCorrectAt: null, spacedCorrectAt: null, met: false },
    independence: { consecutive: 0, met: false },
  };
}

/**
 * Fold a child's events into per-skill evidence.
 *
 * Events may arrive in any order — `cq_events` returns newest first, an offline replay
 * arrives in batches — so they are sorted before folding. Order matters for
 * `consecutiveIndependent` and for the spacing window, and getting it wrong would
 * silently overstate mastery, which is the one direction this must never err in.
 */
export function projectMastery(
  events: readonly ProjectionEvent[],
  now = new Date(),
): SkillEvidenceMap {
  const ordered = [...events].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.itemId.localeCompare(b.itemId),
  );
  const result: SkillEvidenceMap = {};

  for (const event of ordered) {
    const skill = skillById.get(event.skillId);
    if (!skill) continue;
    const current: SkillEvidence = result[event.skillId] ?? {
      ...emptyMastery(),
      evidence: emptyEvidence(),
      state: "untouched",
    };
    const independent = event.support === "none";

    // A prerequisite gap or an obvious guess is not evidence against the child (§C3).
    // It is still recorded, still visible to a parent, and still shapes what comes
    // next — it simply cannot lower the score.
    const scores = event.correct || scoresAgainstMastery(event.errorKind as never);

    const firstEvidence = current.attemptCount === 0;
    const quality = event.correct ? (independent ? 1 : 0.66) : 0.12;
    const score = !scores ? current.score
      : firstEvidence ? quality * 55
      : current.score * 0.72 + quality * 100 * 0.28;

    const activityTypes = uniqueRecent(
      current.activityTypes,
      (event.activityKind ?? "visual-choice") as ActivityType,
      8,
    );
    const contexts = (event.contextTags ?? []).reduce(
      (values, context) => uniqueRecent(values, context, 12),
      current.contexts,
    );
    const sessionIds = uniqueRecent(current.sessionIds, event.sessionId, 8);
    const questionIds = uniqueRecent(current.questionIds, event.itemId, 50);

    const evidenceCoverage = Math.min(1, questionIds.length / skill.evidenceTarget);
    const varietyCoverage = Math.min(1, activityTypes.length / 3);
    const contextCoverage = Math.min(1, contexts.length / 3);
    const sessionCoverage = Math.min(1, sessionIds.length / 3);
    const confidence = 100 * (
      evidenceCoverage * 0.5 + varietyCoverage * 0.15 + contextCoverage * 0.15 + sessionCoverage * 0.2
    );

    const at = event.occurredAt;
    const evidence = current.evidence;

    // 1. Representation. Correct in a second verb is what turns "recognised the letter"
    //    into "knows the sound", and `activityTypes` already recorded it as a statistic.
    //    Here it becomes a gate.
    const verbs = event.correct && !evidence.representation.verbs.includes(event.verb)
      ? [...evidence.representation.verbs, event.verb]
      : evidence.representation.verbs;

    // 2. Spacing. A skill shown twice in one sitting has been remembered for minutes.
    const firstCorrectAt = evidence.spacing.firstCorrectAt
      ?? (event.correct ? at : null);
    const spacedCorrectAt = evidence.spacing.spacedCorrectAt
      ?? (event.correct && firstCorrectAt && Date.parse(at) - Date.parse(firstCorrectAt) >= DAY_MS ? at : null);

    // 3. Independence. Consecutive, so one unsupported success after a run of hints
    //    does not clear the bar on its own.
    const consecutiveIndependent = event.correct && independent
      ? current.consecutiveIndependent + 1
      : 0;

    const due = !!current.nextReviewAt && Date.parse(current.nextReviewAt) <= Date.parse(at);
    const retainedReviews = !event.correct || !independent
      ? 0
      : current.retainedReviews + (due ? 1 : 0);
    const intervals = [1, 3, 7, 14, 30];
    const nextReview = new Date(Date.parse(at));
    nextReview.setUTCDate(nextReview.getUTCDate() + intervals[Math.min(retainedReviews, intervals.length - 1)]);

    result[event.skillId] = {
      score: round(clamp(score)),
      confidence: round(clamp(confidence)),
      attemptCount: current.attemptCount + 1,
      correctCount: current.correctCount + (event.correct ? 1 : 0),
      independentCorrect: current.independentCorrect + (event.correct && independent ? 1 : 0),
      hintCount: current.hintCount + (event.support === "none" ? 0 : 1),
      consecutiveIndependent,
      activityTypes,
      contexts,
      sessionIds,
      lastPracticedAt: at,
      // A same-day repetition must not keep pushing an already scheduled review away.
      nextReviewAt: !due && event.correct && independent && current.nextReviewAt
        ? current.nextReviewAt
        : nextReview.toISOString(),
      questionIds,
      retainedReviews,
      // The three legs are counted here and judged by `lib/evidence-rule.ts`, which is
      // also what the blob-backed `progressionState` asks. One rule, two data sources.
      evidence: {
        representation: {
          verbs,
          met: meetsRepresentation({ representations: verbs.length, spaced: false, consecutiveIndependent: 0 }),
        },
        spacing: {
          firstCorrectAt,
          spacedCorrectAt,
          met: meetsSpacing({ representations: 0, spaced: !!spacedCorrectAt, consecutiveIndependent: 0 }),
        },
        independence: {
          consecutive: consecutiveIndependent,
          met: meetsIndependence({ representations: 0, spaced: false, consecutiveIndependent }),
        },
      },
      state: "practising",
    };
  }

  for (const record of Object.values(result)) {
    record.state = masteryState(
      {
        representations: record.evidence.representation.verbs.length,
        spaced: !!record.evidence.spacing.spacedCorrectAt,
        consecutiveIndependent: record.evidence.independence.consecutive,
      },
      record.attemptCount > 0,
    );
  }
  void now;
  return result;
}

/**
 * The projection in the shape the rest of the app already consumes.
 *
 * Lets WP-06 switch reads over without every caller learning the evidence type at the
 * same time.
 */
export function masteryFromEvents(events: readonly ProjectionEvent[], now = new Date()): SkillMasteryMap {
  return Object.fromEntries(
    Object.entries(projectMastery(events, now)).map(([skillId, record]) => {
      const { evidence, state, ...mastery } = record;
      void evidence; void state;
      return [skillId, mastery satisfies SkillMastery];
    }),
  );
}

/**
 * Plain-words state for one skill.
 *
 * `practising` and `mastered` are different claims and a parent who later discovers
 * they were conflated will not trust the next report. §C2 forbids reporting anything
 * short of all three kinds of evidence as mastery, and this is the only function the
 * parent surface should ask.
 */
export function evidenceState(record: SkillEvidence | undefined) {
  if (!record || record.attemptCount === 0) return "untouched" as const;
  return record.state;
}

/** What is still missing before a skill could be called mastered, in order. */
export function missingEvidence(record: SkillEvidence | undefined): string[] {
  if (!record || record.attemptCount === 0) return ["has not tried this yet"];
  const missing: string[] = [];
  if (!record.evidence.representation.met) missing.push("has shown it in only one kind of activity");
  if (!record.evidence.spacing.met) missing.push("has not come back to it on a later day");
  if (!record.evidence.independence.met) missing.push("still needs a little help");
  return missing;
}

function uniqueRecent<T>(values: readonly T[], value: T, limit: number) {
  return [...values.filter((item) => item !== value), value].slice(-limit);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
