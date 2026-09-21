import type { ActivityType, Question } from "@/lib/curriculum";
import { skillById } from "@/lib/skill-graph";
import { masteryState, type EvidenceCounts } from "@/lib/evidence-rule";

export type SkillMastery = {
  score: number;
  confidence: number;
  attemptCount: number;
  correctCount: number;
  independentCorrect: number;
  hintCount: number;
  consecutiveIndependent: number;
  activityTypes: ActivityType[];
  contexts: string[];
  sessionIds: string[];
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  questionIds: string[];
  retainedReviews: number;
};

export type SkillMasteryMap = Record<string, SkillMastery>;

export function emptyMastery(): SkillMastery {
  return {
    score: 0,
    confidence: 0,
    attemptCount: 0,
    correctCount: 0,
    independentCorrect: 0,
    hintCount: 0,
    consecutiveIndependent: 0,
    activityTypes: [],
    contexts: [],
    sessionIds: [],
    lastPracticedAt: null,
    nextReviewAt: null,
    questionIds: [],
    retainedReviews: 0,
  };
}

export function normalizeMastery(value: unknown): SkillMasteryMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([skillId, candidate]) => {
      if (!skillById.has(skillId) || !candidate || typeof candidate !== "object") return [];
      const record = candidate as Partial<SkillMastery>;
      return [[
        skillId,
        {
          ...emptyMastery(),
          ...record,
          score: clamp(Number(record.score) || 0),
          confidence: clamp(Number(record.confidence) || 0),
          attemptCount: Math.max(0, Number(record.attemptCount) || 0),
          correctCount: Math.max(0, Number(record.correctCount) || 0),
          independentCorrect: Math.max(0, Number(record.independentCorrect) || 0),
          hintCount: Math.max(0, Number(record.hintCount) || 0),
          consecutiveIndependent: Math.max(0, Number(record.consecutiveIndependent) || 0),
          questionIds: Array.isArray(record.questionIds) ? [...new Set(record.questionIds)].slice(-50) : [],
          retainedReviews: Math.max(0, Number(record.retainedReviews) || 0),
          activityTypes: Array.isArray(record.activityTypes) ? record.activityTypes.slice(0, 8) : [],
          contexts: Array.isArray(record.contexts) ? record.contexts.slice(0, 12) : [],
          sessionIds: Array.isArray(record.sessionIds) ? record.sessionIds.slice(0, 8) : [],
          lastPracticedAt: typeof record.lastPracticedAt === "string" ? record.lastPracticedAt : null,
          nextReviewAt: typeof record.nextReviewAt === "string" ? record.nextReviewAt : null,
        } satisfies SkillMastery,
      ]];
    }),
  );
}

export function recordHint(map: SkillMasteryMap, question: Question) {
  const current = map[question.skillId] ?? emptyMastery();
  map[question.skillId] = { ...current, hintCount: current.hintCount + 1 };
}

export function recordAttempt(
  map: SkillMasteryMap,
  question: Question,
  sessionId: string,
  correct: boolean,
  independent: boolean,
  now = new Date(),
) {
  const current = map[question.skillId] ?? emptyMastery();
  const skill = skillById.get(question.skillId)!;
  const firstEvidence = current.attemptCount === 0;
  const quality = correct ? (independent ? 1 : 0.66) : 0.12;
  const score = firstEvidence
    ? quality * 55
    : current.score * 0.72 + quality * 100 * 0.28;
  const attemptCount = current.attemptCount + 1;
  const correctCount = current.correctCount + (correct ? 1 : 0);
  const independentCorrect = current.independentCorrect + (correct && independent ? 1 : 0);
  const consecutiveIndependent = correct && independent ? current.consecutiveIndependent + 1 : 0;
  const activityTypes = uniqueRecent(current.activityTypes, question.engine?.kind ?? "visual-choice", 8);
  const contexts = question.contextTags.reduce(
    (values, context) => uniqueRecent(values, context, 12),
    current.contexts,
  );
  const sessionIds = uniqueRecent(current.sessionIds, sessionId, 8);
  const questionIds = uniqueRecent(current.questionIds ?? [], question.id, 50);
  const evidenceCoverage = Math.min(1, questionIds.length / skill.evidenceTarget);
  const varietyCoverage = Math.min(1, activityTypes.length / 3);
  const contextCoverage = Math.min(1, contexts.length / 3);
  const sessionCoverage = Math.min(1, sessionIds.length / 3);
  const confidence = 100 * (
    evidenceCoverage * 0.5 +
    varietyCoverage * 0.15 +
    contextCoverage * 0.15 +
    sessionCoverage * 0.2
  );
  const normalizedScore = clamp(score);
  const due = !!current.nextReviewAt && Date.parse(current.nextReviewAt) <= now.getTime();
  const retainedReviews = !correct || !independent ? 0
    : (current.retainedReviews ?? 0) + (due ? 1 : 0);
  const intervals = [1, 3, 7, 14, 30];
  const reviewDays = intervals[Math.min(retainedReviews, intervals.length - 1)];
  const nextReview = new Date(now);
  nextReview.setUTCDate(nextReview.getUTCDate() + reviewDays);

  map[question.skillId] = {
    score: round(normalizedScore),
    confidence: round(clamp(confidence)),
    attemptCount,
    correctCount,
    independentCorrect,
    hintCount: current.hintCount,
    consecutiveIndependent,
    activityTypes,
    contexts,
    sessionIds,
    lastPracticedAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
    questionIds,
    retainedReviews,
  };
  // Same-day repetitions must not continually postpone an already scheduled review.
  if (!due && correct && independent && current.nextReviewAt) {
    map[question.skillId].nextReviewAt = current.nextReviewAt;
  }
}

/**
 * The three legs of the evidence rule, read out of the summary blob.
 *
 * The blob does not record verbs, so the engine kinds a child has been correct in stand
 * in for representation — the same proxy `recordAttempt` has always counted — and a
 * review passed on a later day stands in for spacing. They are approximations of what
 * `learning_events` knows exactly, which is why WP-06 switches reads to the projection.
 * Until then they are at least the *same rule*, asked of weaker data.
 */
export function evidenceFromBlob(record: SkillMastery): EvidenceCounts {
  return {
    representations: record.activityTypes.length,
    spaced: (record.retainedReviews ?? 0) >= 1,
    consecutiveIndependent: record.consecutiveIndependent,
  };
}

/**
 * Where a child is with a skill.
 *
 * `mastered` is decided by the evidence rule (§C2) and by nothing else: a high score with
 * one representation, no spacing, or a run of hinted answers is `strong`, which is a
 * perfectly good thing to be and is never reported to a parent as mastery. Before this,
 * a child could reach "mastered" on five independent answers in a single sitting.
 */
export function progressionState(record: SkillMastery | undefined) {
  if (!record || record.attemptCount === 0) return "discovering" as const;
  if (masteryState(evidenceFromBlob(record), true) === "mastered"
    && record.score >= 90 && record.confidence >= 75) return "mastered" as const;
  if (record.score >= 80 && record.confidence >= 55) return "strong" as const;
  if (record.score >= 60) return "growing" as const;
  return "learning" as const;
}

function uniqueRecent<T>(values: T[], value: T, limit: number) {
  return [...values.filter((item) => item !== value), value].slice(-limit);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
