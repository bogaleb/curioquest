import { z } from "zod";
import { errorKinds } from "@/lib/error-kinds";
import { learningVerbs } from "@/lib/learning-events";
import { learningBands, resolveBand, type LearningBandId } from "@/lib/learning-bands";
import type { ErrorKind } from "@/lib/error-kinds";
import type { LearningVerb } from "@/lib/learning-events";

/**
 * The content object model (blueprint §C4), as data rather than as TypeScript literals.
 *
 * Until now a lesson was a function call in `lib/curriculum.ts`. Adding one meant
 * editing a source file, running a generator, pasting a megabyte of SQL and shipping a
 * deploy — which is to say only a developer could do it, and every content decision
 * queued behind an engineer. This module defines the shapes that live in Postgres
 * instead, and the validation that stands between an author and a child.
 *
 * Two rules give the whole package its spine:
 *
 *   1. **Only `published` content is ever served.** `reviewStatus` is not advisory
 *      metadata; it is the gate. Draft work is invisible to children by construction,
 *      which is what makes an authoring surface safe to hand to a non-developer.
 *   2. **Publishing validates the entire catalogue, not the edited item.** A single item
 *      can be locally valid and globally broken — a dangling prerequisite, a lesson that
 *      lost its skill, a distractor whose reason was never written. Validation runs over
 *      the whole graph and refuses the publish rather than the row.
 *
 * Nothing here imports `lib/curriculum.ts`. The mapping between this model and the
 * runtime `Question` shape lives in `lib/catalogue/catalogue.ts`, so that the model can be
 * tested — and an author's draft validated — without loading the bundled bank.
 */

/** `draft` is invisible. `reviewed` is a human's yes. `published` is what a child gets. */
export type ReviewStatus = "draft" | "reviewed" | "published";
export const reviewStatuses: ReviewStatus[] = ["draft", "reviewed", "published"];

/**
 * Text in every locale it has been written in. `en` is required because the gate has to
 * hold somewhere: an item with no readable prompt is not an item.
 *
 * Audio is deliberately *not* a locale of this map — it is an `AssetRef`, because §C5
 * makes audio the primary channel and text the redundant one, and a string cannot be
 * played.
 */
export type Localised = { en: string } & Record<string, string>;

export type AssetKind = "audio" | "art" | "animation";

/**
 * What an asset is *for*, not merely that it exists.
 *
 * WP-07 replaces the synthesiser for phonics. It can only do that if the catalogue
 * knows which clip is the prompt and which is the word being sounded out, so the role
 * is authored now and the recordings land against it later.
 */
export type AssetRole = "prompt-audio" | "hint-audio" | "answer-audio" | "art" | "animation";
export const assetRoles: AssetRole[] = ["prompt-audio", "hint-audio", "answer-audio", "art", "animation"];

export type AssetRef = { assetId: string; role: AssetRole };

export type ContentAsset = {
  id: string;
  kind: AssetKind;
  locale: string;
  uri: string;
  licence: string;
  durationMs?: number | null;
};

export type ContentSkill = {
  id: string;
  subject: string;
  strand: string;
  /** What a grown-up calls it. Appears in the parent weekly and nowhere a child looks. */
  name: string;
  /** What Nova calls it. §C5: no system vocabulary on a child surface. */
  childName: string;
  description: string;
  prerequisites: string[];
  bands: LearningBandId[];
  evidenceTarget: number;
  active: boolean;
};

/** The worked example a lesson opens with. Gradual release starts with someone showing. */
export type LessonStep = {
  /** What the child watches happen. */
  demonstration: Localised;
  /** The thinking said out loud while it happens — the "worked" in worked example. */
  narration: Localised;
  assets: AssetRef[];
};

export type ContentLesson = {
  id: string;
  skillId: string;
  title: string;
  /** Shown to the child when the lesson opens. Never the `title`, which is for adults. */
  childTitle: string;
  model: LessonStep | null;
  position: number;
  reviewStatus: ReviewStatus;
};

/**
 * The parts of an item that describe how it is *delivered* rather than what it teaches.
 *
 * This is the seam between the new model and the engines that already exist and work.
 * `activityType` and `engine` are the runtime `Question` fields verbatim: §J says the
 * activity engines are "the good part; extend, don't replace", so the catalogue carries
 * their configuration untouched rather than inventing a parallel vocabulary for it.
 */
export type ItemDelivery = {
  activityType: string;
  engine?: unknown;
  visual?: string | null;
  contextTags: string[];
  estimatedMinutes: number;
  /** The legacy content pool and difficulty rung. Kept so the recommender is unchanged. */
  grade: "prek" | "grade1";
  level: number;
  subject: string;
  passage?: { title: string; text: string; emoji: string } | null;
  audioLabel?: string | null;
  campaignOnly?: boolean;
  /**
   * The order the choices appear in.
   *
   * Which options exist is content; the order they sit in is delivery. Keeping the
   * authored order here means migrating the bundled bank changes nothing a child sees,
   * rather than reshuffling fourteen hundred live items on the day the catalogue landed.
   */
  options?: string[];
};

export type ContentDistractor = {
  value: string;
  /**
   * Why a child picks this (§C3), or null where nobody has said yet.
   *
   * Null is expressible on purpose. The WP-04 inference has an opinion about 82 of the
   * 428 wrong answers in the migrated bank; writing `guess` over the rest would be a lie
   * the product acts on, because `guess` is one of the two kinds that never counts
   * against a mastery score. An absent reason falls through to the runtime inference
   * exactly as it does today, and the validator counts it as work outstanding.
   */
  errorKind: ErrorKind | null;
  /**
   * True only where a person chose the reason. `lib/distractor-reasons.ts` inferring one
   * is a starting position, not authorship, and this column is what keeps the difference
   * countable rather than rhetorical.
   */
  reviewed: boolean;
  /** Optional author's note about *why* a child picks this. Never shown to a child. */
  note?: string | null;
};

export type ContentItem = {
  id: string;
  lessonId: string;
  skillId: string;
  verb: LearningVerb;
  phase: "discover" | "guided" | "independent" | "transfer";
  bands: LearningBandId[];
  prompt: Localised;
  hint: Localised;
  explanation: Localised;
  answer: string;
  distractors: ContentDistractor[];
  assets: AssetRef[];
  delivery: ItemDelivery;
  reviewStatus: ReviewStatus;
};

export type ContentEpisode = {
  id: string;
  title: string;
  synopsis: string;
  /** Lesson ids, in the order the episode walks them. */
  order: string[];
  scenes: unknown[];
  rewardObjectId: string | null;
  reviewStatus: ReviewStatus;
};

export type Catalogue = {
  version: number;
  label: string;
  skills: ContentSkill[];
  lessons: ContentLesson[];
  items: ContentItem[];
  assets: ContentAsset[];
  episodes: ContentEpisode[];
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const bandIds = learningBands.map((band) => band.id) as [LearningBandId, ...LearningBandId[]];

const localised = z
  .record(z.string())
  .refine((value) => typeof value.en === "string" && value.en.trim().length > 0, {
    message: "needs English text (the `en` key)",
  }) as unknown as z.ZodType<Localised>;

const assetRef = z.object({
  assetId: z.string().min(1).max(120),
  role: z.enum(assetRoles as [AssetRole, ...AssetRole[]]),
});

export const skillSchema = z.object({
  id: z.string().min(1).max(120).regex(/^[A-Z0-9._]+$/, "uses capitals, digits, dots and underscores only"),
  subject: z.string().min(1).max(40),
  strand: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  childName: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  prerequisites: z.array(z.string().min(1).max(120)).max(12),
  bands: z.array(z.enum(bandIds)).min(1),
  evidenceTarget: z.number().int().min(1).max(30),
  active: z.boolean(),
});

export const lessonStepSchema = z.object({
  demonstration: localised,
  narration: localised,
  assets: z.array(assetRef).max(12),
});

export const lessonSchema = z.object({
  id: z.string().min(1).max(120),
  skillId: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  childTitle: z.string().min(1).max(160),
  model: lessonStepSchema.nullable(),
  position: z.number().int().min(0).max(9999),
  reviewStatus: z.enum(reviewStatuses as [ReviewStatus, ...ReviewStatus[]]),
});

export const distractorSchema = z.object({
  value: z.string().min(1).max(400),
  errorKind: z.enum(errorKinds as [ErrorKind, ...ErrorKind[]]).nullable(),
  reviewed: z.boolean(),
  note: z.string().max(400).nullable().optional(),
});

export const deliverySchema = z.object({
  activityType: z.string().min(1).max(60),
  engine: z.unknown().optional(),
  visual: z.string().max(200).nullable().optional(),
  contextTags: z.array(z.string().min(1).max(40)).max(8),
  estimatedMinutes: z.number().int().min(1).max(30),
  grade: z.enum(["prek", "grade1"]),
  level: z.number().int().min(1).max(20),
  subject: z.string().min(1).max(40),
  passage: z
    .object({ title: z.string().max(200), text: z.string().max(4000), emoji: z.string().max(16) })
    .nullable()
    .optional(),
  audioLabel: z.string().max(200).nullable().optional(),
  campaignOnly: z.boolean().optional(),
  options: z.array(z.string().min(1).max(400)).max(8).optional(),
});

export const itemSchema = z.object({
  id: z.string().min(1).max(120),
  lessonId: z.string().min(1).max(120),
  skillId: z.string().min(1).max(120),
  verb: z.enum(learningVerbs as [LearningVerb, ...LearningVerb[]]),
  phase: z.enum(["discover", "guided", "independent", "transfer"]),
  bands: z.array(z.enum(bandIds)).min(1),
  prompt: localised,
  hint: localised,
  explanation: localised,
  // Empty for an engine item, and that is not a gap.
  //
  // A sorting board, a route, a number bond: correctness is computed from the finished
  // state rather than compared to a string, and 112 of the migrated items work this way.
  // Requiring a string here would force an author to invent an answer key the engine
  // never reads. The cross-check below demands one for everything else.
  answer: z.string().max(400),
  distractors: z.array(distractorSchema).max(8),
  assets: z.array(assetRef).max(12),
  delivery: deliverySchema,
  reviewStatus: z.enum(reviewStatuses as [ReviewStatus, ...ReviewStatus[]]),
});

export const assetSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(["audio", "art", "animation"]),
  locale: z.string().min(2).max(12),
  uri: z.string().min(1).max(600),
  licence: z.string().min(1).max(200),
  durationMs: z.number().int().min(0).max(3600000).nullable().optional(),
});

export const episodeSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  synopsis: z.string().max(1000),
  order: z.array(z.string().min(1).max(120)).max(60),
  scenes: z.array(z.unknown()).max(120),
  rewardObjectId: z.string().max(120).nullable(),
  reviewStatus: z.enum(reviewStatuses as [ReviewStatus, ...ReviewStatus[]]),
});

export const catalogueSchema = z.object({
  version: z.number().int().min(0),
  label: z.string().min(1).max(120),
  skills: z.array(skillSchema),
  lessons: z.array(lessonSchema),
  items: z.array(itemSchema),
  assets: z.array(assetSchema),
  episodes: z.array(episodeSchema),
});

// ---------------------------------------------------------------------------
// Whole-catalogue validation
// ---------------------------------------------------------------------------

/**
 * One thing wrong, said in a sentence an author can act on.
 *
 * `where` is the row they should open, `field` is what to change, and `message`
 * finishes the sentence "this item ...". Zod's own messages are folded into this shape
 * rather than surfaced raw, because `items.412.prompt: Invalid input` is not a readable
 * error and the acceptance test for this work package asks for one.
 */
export type CatalogueProblem = {
  severity: "error" | "warning";
  where: string;
  field: string;
  message: string;
};

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The tightest on-screen word budget across the bands an item is offered to (§C5). */
function promptBudget(bands: LearningBandId[]) {
  return Math.min(...bands.map((band) => resolveBand(band).delivery.maxPromptWords));
}

/** Engines carry their own answer surface, so they are exempt from the choice rules. */
function isEngineItem(item: ContentItem) {
  return !!item.delivery.engine;
}

/**
 * Validate a whole catalogue and say, in plain sentences, everything wrong with it.
 *
 * Errors block a publish. Warnings do not, because an author who cannot publish until
 * every advisory is cleared will stop using the tool — but they are counted and shown,
 * so the backlog stays visible rather than becoming invisible debt.
 */
export function validateCatalogue(input: unknown): CatalogueProblem[] {
  const parsed = catalogueSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.slice(0, 200).map((issue) => {
      const path = issue.path;
      const collection = String(path[0] ?? "catalogue");
      const index = typeof path[1] === "number" ? path[1] : null;
      const record =
        index !== null
          ? (input as Record<string, Array<{ id?: string }> | undefined>)?.[collection]?.[index]
          : null;
      return {
        severity: "error" as const,
        where: record?.id ? `${collection.replace(/s$/, "")} ${record.id}` : collection,
        field: path.slice(index === null ? 1 : 2).join(".") || collection,
        message: issue.message,
      };
    });
  }

  const catalogue = parsed.data as Catalogue;
  const problems: CatalogueProblem[] = [];
  const error = (where: string, field: string, message: string) =>
    problems.push({ severity: "error", where, field, message });
  const warn = (where: string, field: string, message: string) =>
    problems.push({ severity: "warning", where, field, message });

  const skills = new Map(catalogue.skills.map((skill) => [skill.id, skill]));
  const lessons = new Map(catalogue.lessons.map((lesson) => [lesson.id, lesson]));
  const assets = new Set(catalogue.assets.map((asset) => asset.id));

  if (skills.size !== catalogue.skills.length) error("catalogue", "skills", "contains two skills with the same id");
  if (lessons.size !== catalogue.lessons.length) error("catalogue", "lessons", "contains two lessons with the same id");

  for (const skill of catalogue.skills) {
    for (const prerequisite of skill.prerequisites) {
      if (prerequisite === skill.id) {
        error(`skill ${skill.id}`, "prerequisites", "requires itself");
      } else if (!skills.has(prerequisite)) {
        error(`skill ${skill.id}`, "prerequisites", `requires ${prerequisite}, which is not in the catalogue`);
      }
    }
  }

  // A prerequisite cycle makes the recommender loop forever looking for a foundation
  // that is always one step further back. Caught here, once, rather than at 3am.
  const state = new Map<string, "visiting" | "done">();
  const walk = (id: string, trail: string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      error(`skill ${id}`, "prerequisites", `is part of a loop: ${[...trail, id].join(" → ")}`);
      return;
    }
    state.set(id, "visiting");
    for (const prerequisite of skills.get(id)?.prerequisites ?? []) {
      if (skills.has(prerequisite) && prerequisite !== id) walk(prerequisite, [...trail, id]);
    }
    state.set(id, "done");
  };
  for (const skill of catalogue.skills) walk(skill.id, []);

  for (const lesson of catalogue.lessons) {
    const skill = skills.get(lesson.skillId);
    if (!skill) {
      error(`lesson ${lesson.id}`, "skillId", `teaches ${lesson.skillId}, which is not in the catalogue`);
    } else if (lesson.reviewStatus === "published" && !skill.active) {
      error(`lesson ${lesson.id}`, "skillId", `is published but ${skill.id} is switched off`);
    }
    for (const ref of lesson.model?.assets ?? []) {
      if (!assets.has(ref.assetId)) {
        error(`lesson ${lesson.id}`, "model.assets", `refers to missing asset ${ref.assetId}`);
      }
    }
  }

  const seen = new Set<string>();
  for (const item of catalogue.items) {
    const where = `item ${item.id}`;
    if (seen.has(item.id)) error(where, "id", "shares an id with another item");
    seen.add(item.id);

    const lesson = lessons.get(item.lessonId);
    if (!lesson) error(where, "lessonId", `belongs to ${item.lessonId}, which is not in the catalogue`);
    const skill = skills.get(item.skillId);
    if (!skill) {
      error(where, "skillId", `practises ${item.skillId}, which is not in the catalogue`);
    } else {
      if (lesson && lesson.skillId !== item.skillId) {
        error(where, "skillId", `practises ${item.skillId} but sits in a lesson that teaches ${lesson.skillId}`);
      }
      if (skill.subject !== item.delivery.subject) {
        error(where, "delivery.subject", `is filed under ${item.delivery.subject} but its skill is ${skill.subject}`);
      }
      if (item.reviewStatus === "published" && !skill.active) {
        error(where, "reviewStatus", `is published but ${skill.id} is switched off`);
      }
      const orphanBands = item.bands.filter((band) => !skill.bands.includes(band));
      if (orphanBands.length) {
        warn(where, "bands", `is offered to ${orphanBands.join(", ")}, which its skill does not cover`);
      }
    }

    if (item.reviewStatus === "published" && lesson && lesson.reviewStatus !== "published") {
      error(where, "reviewStatus", "is published inside a lesson that is not");
    }

    if (!isEngineItem(item)) {
      if (!item.answer.trim()) {
        error(where, "answer", "has no right answer, and no engine to work one out from");
      }
      if (!item.distractors.length) {
        error(where, "distractors", "has no wrong answers, so there is nothing to choose between");
      }
      const values = new Set<string>();
      for (const distractor of item.distractors) {
        if (distractor.value === item.answer) {
          error(where, "distractors", `offers "${distractor.value}" as both the answer and a wrong answer`);
        }
        if (values.has(distractor.value)) {
          error(where, "distractors", `offers "${distractor.value}" twice`);
        }
        values.add(distractor.value);
      }
    }

    const ordered = item.delivery.options;
    if (ordered?.length) {
      const offered = new Set([item.answer, ...item.distractors.map((d) => d.value)]);
      for (const option of ordered) {
        if (!offered.has(option)) {
          error(where, "delivery.options", `shows "${option}", which is neither the answer nor a wrong answer`);
        }
      }
      if (!ordered.includes(item.answer)) {
        error(where, "delivery.options", "leaves the right answer off the screen");
      }
    }

    for (const distractor of item.distractors) {
      if (distractor.reviewed && !distractor.errorKind) {
        error(where, "distractors", `marks "${distractor.value}" reviewed without choosing a reason for it`);
      }
    }

    // Two separate backlogs, counted separately because they are different work.
    // "Nobody has written a reason" is a gap; "a machine wrote one" is a draft.
    if (item.reviewStatus === "published") {
      const missing = item.distractors.filter((distractor) => !distractor.errorKind).length;
      const inferred = item.distractors.filter((distractor) => distractor.errorKind && !distractor.reviewed).length;
      if (missing) {
        warn(where, "distractors", `has ${missing} wrong answer${missing === 1 ? "" : "s"} with no reason written, so feedback for ${missing === 1 ? "it" : "them"} falls back to a guess at the misconception`);
      }
      if (inferred) {
        warn(where, "distractors", `has ${inferred} wrong answer${inferred === 1 ? "" : "s"} whose reason a machine guessed, not a person`);
      }
    }

    const budget = promptBudget(item.bands);
    const length = words(item.prompt.en);
    if (length > budget) {
      error(where, "prompt", `puts ${length} words on screen; the youngest band it is offered to can hold ${budget}`);
    }
    if (/[A-Z]{4,}/.test(item.prompt.en)) {
      error(where, "prompt", "shouts in capitals, which §C5 does not allow on a child surface");
    }
    for (const term of ["activity", "session", "skill", "module"]) {
      if (new RegExp(`\\b${term}\\b`, "i").test(item.prompt.en)) {
        warn(where, "prompt", `says "${term}", which is product vocabulary a child does not use`);
      }
    }

    for (const ref of item.assets) {
      if (!assets.has(ref.assetId)) error(where, "assets", `refers to missing asset ${ref.assetId}`);
    }
    if (item.reviewStatus === "published" && item.verb === "choose" && item.phase === "transfer") {
      warn(where, "verb", "asks a child to transfer a skill by tapping one of three options");
    }
  }

  for (const episode of catalogue.episodes) {
    for (const lessonId of episode.order) {
      if (!lessons.has(lessonId)) {
        error(`episode ${episode.id}`, "order", `plays ${lessonId}, which is not in the catalogue`);
      }
    }
  }

  const published = catalogue.items.filter((item) => item.reviewStatus === "published");
  if (!published.length) error("catalogue", "items", "has nothing published, so a child would be shown an empty app");
  const choosing = published.filter((item) => item.verb === "choose").length;
  if (published.length && choosing / published.length > 0.75) {
    warn(
      "catalogue",
      "items",
      `is ${Math.round((choosing / published.length) * 100)}% tap-one-of-three; §C1 wants that under a quarter`,
    );
  }

  return problems;
}

export function catalogueErrors(problems: CatalogueProblem[]) {
  return problems.filter((problem) => problem.severity === "error");
}

/** One line per problem, ready to show an author without further formatting. */
export function describeProblem(problem: CatalogueProblem) {
  return `${problem.where} — ${problem.field}: ${problem.message}`;
}
