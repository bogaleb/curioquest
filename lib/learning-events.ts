import type { ActivityType, Question } from "@/lib/curriculum";
import type { LearningPhase } from "@/lib/skill-graph";
import type { ErrorKind } from "@/lib/error-kinds";

/**
 * The learning event stream (blueprint §C1).
 *
 * One row per attempt, appended and never changed. This module owns the shape, the
 * vocabulary, and the translation from the engines the app already has into that
 * vocabulary. Writing is in `lib/backend/repository.ts`, because it has to happen inside
 * the same transaction as the profile save.
 *
 * The rule the rest of the codebase has to obey: an interaction that records nothing
 * did not happen.
 */

/**
 * What the child actually did.
 *
 * Ordered roughly by the strength of the evidence each produces. `choose` — tap the
 * right picture — is last for a reason: it demonstrates recognition, which is the
 * weakest evidence of learning there is, and the content plan exists to shrink it to
 * under a quarter of any quest.
 */
export type LearningVerb =
  | "say"
  | "build"
  | "sequence"
  | "sort"
  | "predict"
  | "fix"
  | "explain"
  | "make"
  | "choose";

export const learningVerbs: LearningVerb[] = [
  "say", "build", "sequence", "sort", "predict", "fix", "explain", "make", "choose",
];

/** Where in the gradual release of responsibility this attempt sat. */
export type EventPhase = LearningPhase;

/**
 * How much support was standing when the answer was given.
 *
 * The evidence rule (§C2) requires two consecutive correct attempts at `none`. Every
 * other value is practice, and must be reported to a parent as practice.
 */
export type SupportLevel = "none" | "hint" | "model" | "scaffold" | "adult";

export type LearningEvent = {
  /** Client-or-server generated; makes an offline replay idempotent. */
  id: string;
  sessionId: string;
  occurredAt: string;
  skillId: string;
  itemId: string;
  lessonId?: string | null;
  episodeId?: string | null;
  verb: LearningVerb;
  phase: EventPhase;
  correct: boolean;
  support: SupportLevel;
  /** The option chosen when wrong. Null on a correct answer. */
  distractor?: string | null;
  errorKind?: ErrorKind | null;
  latencyMs?: number | null;
  catalogueVersion: string;
};

/**
 * Which verb an existing engine exercises.
 *
 * The specialist engines were always the good part of this codebase; this is where that
 * becomes measurable. Anything that is a bare list of options is `choose`, and the gap
 * between how many `choose` rows and how many of everything else the stream collects is
 * the honest measure of whether the content plan is working.
 */
const verbByActivity: Record<ActivityType, LearningVerb> = {
  "sound-choice": "choose",
  "visual-choice": "choose",
  "story-choice": "choose",
  "number-choice": "choose",
  "pattern-choice": "choose",
  "reasoning-choice": "choose",
  counting: "build",
  sorting: "sort",
  memory: "sequence",
  "word-builder": "build",
  pattern: "sequence",
  "ten-frame": "build",
  route: "sequence",
  matching: "sort",
  ordering: "sequence",
  "bubble-pop": "sort",
  balance: "predict",
  constellation: "sequence",
  "number-line": "build",
  "number-bond": "build",
  "place-value": "build",
  "array-builder": "build",
  investigation: "predict",
};

export function verbForActivity(activityType: ActivityType): LearningVerb {
  return verbByActivity[activityType] ?? "choose";
}

/** The reading slice has its own engine names and its own verbs. */
export function verbForReadingActivity(kind: string): LearningVerb {
  if (kind === "sound-boxes") return "build";
  if (kind === "blend-train") return "sequence";
  return "choose";
}

/**
 * Translate the scaffolding ladder into a support level.
 *
 * `hintAsked` and the ladder are different things and both matter: a child who pressed
 * "give me a clue" and a child whom Nova stepped in for after three wrong answers have
 * both had help, and neither attempt is independent evidence.
 */
export function supportFrom(options: { hintLevel?: number; hinted?: boolean; adult?: boolean }): SupportLevel {
  if (options.adult) return "adult";
  const level = options.hintLevel ?? 0;
  if (level >= 3) return "model";
  if (level === 2) return "scaffold";
  if (level === 1 || options.hinted) return "hint";
  return "none";
}

/** Latency, clamped to the range the column accepts and rounded to whole milliseconds. */
export function latency(startedAt: number | string | null | undefined, now = Date.now()) {
  if (startedAt === null || startedAt === undefined) return null;
  const started = typeof startedAt === "string" ? Date.parse(startedAt) : startedAt;
  // `Number.isFinite` rather than a truthiness check: epoch zero is a legitimate
  // timestamp, and treating it as missing would silently drop latency in any test or
  // fixture that starts its clock there.
  if (!Number.isFinite(started)) return null;
  return Math.min(3_600_000, Math.max(0, Math.round(now - started)));
}

/**
 * Build the event for one attempt at one authored question.
 *
 * Kept as a pure function so the route handlers stay readable and so the mapping is
 * testable without a database or a request.
 */
export function eventForQuestion(input: {
  id?: string;
  question: Pick<Question, "id" | "skillId" | "activityType" | "phase"> &
    Partial<Pick<Question, "verb" | "lessonId">>;
  sessionId: string;
  correct: boolean;
  support: SupportLevel;
  response?: string;
  errorKind?: ErrorKind | null;
  latencyMs?: number | null;
  catalogueVersion: string;
  lessonId?: string | null;
  episodeId?: string | null;
  occurredAt?: string;
}): LearningEvent {
  return {
    id: input.id ?? crypto.randomUUID(),
    sessionId: input.sessionId,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    skillId: input.question.skillId,
    itemId: input.question.id,
    lessonId: input.lessonId ?? input.question.lessonId ?? null,
    episodeId: input.episodeId ?? null,
    // An authored verb, where the published catalogue carries one. `verbForActivity`
    // reads it off the engine kind, which cannot tell a child sorting shapes from a
    // child sorting sounds — it is a fallback for content that predates §C4, not the
    // definition.
    verb: input.question.verb ?? verbForActivity(input.question.activityType),
    phase: input.question.phase,
    correct: input.correct,
    support: input.support,
    distractor: input.correct ? null : (input.response ?? null),
    errorKind: input.correct ? null : (input.errorKind ?? null),
    latencyMs: input.latencyMs ?? null,
    catalogueVersion: input.catalogueVersion,
  };
}

const verbs = new Set<string>(learningVerbs);
const phases = new Set<string>(["discover", "guided", "independent", "transfer"]);
const supports = new Set<string>(["none", "hint", "model", "scaffold", "adult"]);

/**
 * Reject an event the database would refuse, before it reaches the database.
 *
 * The append is batched inside the same transaction as the profile save, so one
 * malformed row would roll back a child's progress. Dropping it here instead loses one
 * event; letting it through loses the session.
 */
export function isValidEvent(value: unknown): value is LearningEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<LearningEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.sessionId === "string" && event.sessionId.length > 0 && event.sessionId.length <= 64 &&
    typeof event.skillId === "string" && event.skillId.length > 0 && event.skillId.length <= 120 &&
    typeof event.itemId === "string" && event.itemId.length > 0 && event.itemId.length <= 120 &&
    typeof event.verb === "string" && verbs.has(event.verb) &&
    typeof event.phase === "string" && phases.has(event.phase) &&
    typeof event.correct === "boolean" &&
    typeof event.support === "string" && supports.has(event.support) &&
    typeof event.catalogueVersion === "string" && event.catalogueVersion.length > 0
  );
}

export function validEvents(events: readonly unknown[]): LearningEvent[] {
  return events.filter(isValidEvent);
}
