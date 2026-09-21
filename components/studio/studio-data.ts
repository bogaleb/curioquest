import type { ContentItem, ContentSkill, CatalogueProblem, ReviewStatus } from "@/lib/catalogue/model";

/**
 * What the studio sends and receives, and one place that knows the endpoint's shape.
 *
 * Every call funnels through `studioGet` / `studioPost` so a failure has exactly one
 * translation into something an author can read. The route already speaks in sentences;
 * these two functions make sure none of them is swallowed by a `.catch(() => null)`.
 */

export type Overview = {
  current: { version: number; label: string; publishedAt: string; itemCount: number; skillCount: number; warnings: number } | null;
  versions: { version: number; label: string; publishedAt: string; itemCount: number; isCurrent: boolean }[];
  counts: {
    skills: number; activeSkills: number; lessons: number; items: number;
    draft: number; reviewed: number; published: number;
    distractors: number; unreviewedReasons: number; noReason: number;
    assets: number; episodes: number;
  };
  reasonQueue: { errorKind: string; pending: number; total: number }[];
};

export type SkillRow = ContentSkill & { lessonCount: number; itemCount: number; publishedCount: number };
export type LessonRow = {
  id: string; skillId: string; title: string; childTitle: string;
  model: unknown; position: number; reviewStatus: ReviewStatus; itemCount: number;
};
export type ItemRow = ContentItem & { source: string; updatedAt: string; unreviewedReasons: number };

export type ProblemLine = CatalogueProblem & { sentence: string };
export type ValidationReport = { problems: ProblemLine[]; errorCount: number; publishable: boolean };

/** Carries the route's own sentence, plus whether the refusal was about authorship. */
export class StudioError extends Error {
  constructor(message: string, readonly status: number, readonly problems?: ProblemLine[]) {
    super(message);
    this.name = "StudioError";
  }
}

async function unwrap(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new StudioError(
      typeof body.error === "string" ? body.error : "The studio could not complete that.",
      response.status,
      Array.isArray(body.problems) ? (body.problems as ProblemLine[]) : undefined,
    );
  }
  return body;
}

export async function studioGet<T>(kind: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const search = new URLSearchParams({ kind });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== false) search.set(key, String(value));
  }
  return (await unwrap(await fetch(`/api/studio?${search}`, { cache: "no-store" }))).data as T;
}

export async function studioPost<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch("/api/studio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return (await unwrap(response)).data as T;
}

/**
 * Publish, which is the one call whose *refusal* is the useful answer.
 *
 * A 422 here is not an error in the transport sense — it is the validator telling an
 * author what to fix, and it must reach the screen with its sentences intact rather
 * than as "request failed".
 */
export async function studioPublish(label: string, notes: string) {
  const response = await fetch("/api/studio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "publish", label, notes }),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 422) {
    return { ok: false as const, message: String(body.error ?? "This publish was refused."), problems: (body.problems ?? []) as ProblemLine[] };
  }
  if (!response.ok) throw new StudioError(String(body.error ?? "The publish could not be completed."), response.status);
  return {
    ok: true as const,
    version: body.data as { version: number; itemCount: number; skillCount: number },
    problems: (body.problems ?? []) as ProblemLine[],
  };
}

/** Human labels for the closed §C3 vocabulary. The ids are for machines, not authors. */
export const errorKindLabels: Record<string, string> = {
  "confusable-visual": "Looks like the answer",
  "confusable-sound": "Sounds like the answer",
  "letter-name-for-sound": "Letter name, not its sound",
  "off-by-one": "Counted one out",
  "wrong-attribute": "Sorted by the wrong thing",
  "sequence-reversed": "Right parts, wrong order",
  guess: "A quick guess",
  "not-yet-taught": "Not taught yet",
  unexplained: "No reason written yet",
};

export const statusLabels: Record<ReviewStatus, string> = {
  draft: "Draft",
  reviewed: "Reviewed",
  published: "Published",
};
