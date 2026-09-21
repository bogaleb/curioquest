import type { Question } from "@/lib/curriculum";
import type { ErrorKind } from "@/lib/error-kinds";
import type { ActivityEngine } from "@/lib/activity-types";
import { catalogueSchema, type Catalogue, type ContentItem } from "./model";

/**
 * The bridge between the catalogue in Postgres and the runtime the app already has.
 *
 * `Question` is the shape every engine, the recommender, the evaluator and the event
 * writer consume today, and §J is explicit that those are the good parts. So the
 * published snapshot is translated into `Question` here rather than being pushed
 * through the application as a second, parallel vocabulary. One function, one seam,
 * one place to look when a field goes missing.
 *
 * Two fields ride along that the bundled bank never carried:
 *
 *   * `verb` — authored, rather than guessed from the engine kind. `lib/learning-events.ts`
 *     had to infer it from `activityType`, which cannot tell a child sorting shapes from
 *     a child sorting sounds.
 *   * `distractorReasons` — the authored §C3 reason per wrong answer. Until now every
 *     reason in the product was inferred at runtime by `lib/distractor-reasons.ts`;
 *     an authored one always wins, and this is how an author's decision reaches it.
 */

export type CatalogueSnapshot = Catalogue;

export type PublishedCatalogue = {
  /** `db-<version>`, recorded on every learning event. `code-1` means nothing published. */
  version: string;
  label: string;
  questions: Question[];
  /** Skills as published, so `lib/skill-graph.ts` can become a loader over the same row. */
  skills: Catalogue["skills"];
  lessons: Catalogue["lessons"];
};

/**
 * The choices, in the order an author put them.
 *
 * Order is a delivery decision rather than a content one, so the seed carries the exact
 * array the bundled bank produced. Falling back to answer-then-distractors would
 * reshuffle every live item on the day the catalogue went in, which is a content change
 * disguised as a migration.
 */
function optionsFor(item: ContentItem): string[] {
  const authored = (item.delivery as { options?: unknown }).options;
  const values = [item.answer, ...item.distractors.map((distractor) => distractor.value)];
  if (!Array.isArray(authored) || !authored.length) return values;
  const order = authored.filter((value): value is string => typeof value === "string");
  const known = new Set(values);
  // Anything the authored order does not mention still has to be offered, or an edit to
  // the distractors would silently drop a choice the item depends on.
  const missing = values.filter((value) => !order.includes(value));
  return [...order.filter((value) => known.has(value)), ...missing];
}

function text(value: Record<string, string> | undefined, locale = "en") {
  if (!value) return "";
  return value[locale] ?? value.en ?? "";
}

/** One published item, as the engines expect to receive it. */
export function toQuestion(item: ContentItem, locale = "en"): Question {
  const delivery = item.delivery;
  return {
    id: item.id,
    subject: delivery.subject as Question["subject"],
    grade: delivery.grade,
    level: delivery.level,
    skillId: item.skillId,
    activityType: delivery.activityType as Question["activityType"],
    phase: item.phase,
    estimatedMinutes: delivery.estimatedMinutes,
    contextTags: delivery.contextTags as Question["contextTags"],
    prompt: text(item.prompt, locale),
    visual: delivery.visual ?? undefined,
    options: optionsFor(item),
    answer: item.answer,
    hint: text(item.hint, locale),
    explanation: text(item.explanation, locale),
    engine: (delivery.engine as ActivityEngine | undefined) ?? undefined,
    campaignOnly: delivery.campaignOnly,
    passage: delivery.passage ?? undefined,
    audioLabel: delivery.audioLabel ?? undefined,
    lessonId: item.lessonId,
    verb: item.verb,
    reviewStatus: item.reviewStatus,
    // Only reasons somebody actually wrote. A distractor with no reason is left out
    // entirely rather than passed along as null, because `lib/distractor-reasons.ts`
    // treats an authored reason as final — handing it a null would suppress the runtime
    // inference and leave the child with no teaching move at all.
    distractorReasons: item.distractors
      .filter((distractor): distractor is typeof distractor & { errorKind: ErrorKind } => !!distractor.errorKind)
      .map((distractor) => ({ value: distractor.value, errorKind: distractor.errorKind })),
  };
}

/**
 * Turn a published snapshot into the pool the recommender selects from.
 *
 * The `published` filter is belt and braces: `content.cq_snapshot(true)` already refuses
 * to include anything else, and the gate is restated here so that a snapshot loaded from
 * a file, a fixture or a rolled-back version obeys the same rule. §C4 says only published
 * content is ever served, and a rule enforced in exactly one place is a rule waiting to
 * be bypassed.
 */
export function questionsFromSnapshot(snapshot: Catalogue, locale = "en"): Question[] {
  return snapshot.items
    .filter((item) => item.reviewStatus === "published")
    .map((item) => toQuestion(item, locale));
}

/**
 * Parse whatever the database returned, and refuse it if it is not a catalogue.
 *
 * A malformed snapshot must not reach a child, but neither may it take the app down:
 * returning null puts the loader back on the bundled bank, which is a worse catalogue
 * than the published one and a far better outcome than a 503 for every family.
 */
export function readSnapshot(value: unknown): Catalogue | null {
  const parsed = catalogueSchema.safeParse(value);
  return parsed.success ? (parsed.data as Catalogue) : null;
}
