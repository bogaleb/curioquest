import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { parentId } from './context';
import type { Json } from '@/lib/supabase/database.types';
import type { ExplorerProfile } from '@/lib/explorers';
import { questions as authoredQuestions, type Question } from '@/lib/curriculum';
import { validEvents, type LearningEvent } from '@/lib/learning-events';
import { catalogueVersion, CODE_CATALOGUE_VERSION } from '@/lib/catalogue-version';
import { questionsFromSnapshot, readSnapshot, type PublishedCatalogue } from '@/lib/catalogue/catalogue';
import { eventFromRow, masteryFromEvents } from '@/lib/mastery-projection';
import type { SkillMasteryMap } from '@/lib/mastery';
import { emptyRetention, MIN_WRONG_ANSWERS, type ItemHealth, type Retention } from '@/lib/insights';

export async function read<T>(kind: string, options: {child?: string; id?: string; filter?: string; limit?: number; offset?: number} = {}): Promise<T> {
  const { data, error } = await createAdminClient().rpc('cq_read', {
    p_parent: parentId(), p_kind: kind, p_child: uuid(options.child), p_id: uuid(options.id),
    p_filter: options.filter ?? null, p_limit: options.limit ?? 100, p_offset: options.offset ?? 0,
  });
  if (error) throw new Error(`Family read failed (${error.code}).`);
  return data as T;
}
export async function commit<T>(kind: string, payload: unknown): Promise<T> {
  const { data, error } = await createAdminClient().rpc('cq_commit', {
    p_parent: parentId(), p_kind: kind, p_data: payload as Json,
  });
  if (error) throw new Error(`Family save failed (${error.code}).`);
  return data as T;
}

/**
 * Commit family state and append the evidence the interaction produced, atomically.
 *
 * The database function calls `cq_commit` inside the same transaction, so a save that
 * loses an optimistic-concurrency race writes no events, and an event batch that the
 * database rejects rolls the save back with it. That is the point: §A requires that
 * every learning interaction writes a `learning_event`, and a second round trip after a
 * successful save would quietly break that rule on any network blip.
 *
 * Events are validated here rather than trusted, because one malformed row would roll
 * back a child's whole session.
 */
export async function commitWithEvents<T>(
  kind: string,
  payload: unknown,
  childId: string,
  events: readonly LearningEvent[],
): Promise<T> {
  const child = uuid(childId);
  const valid = validEvents(events);
  if (!child || !valid.length) return commit<T>(kind, payload);
  const { data, error } = await createAdminClient().rpc('cq_commit_events', {
    p_parent: parentId(), p_kind: kind, p_data: payload as Json,
    p_child: child, p_events: valid as unknown as Json,
  });
  if (error) throw new Error(`Family save failed (${error.code}).`);
  return data as T;
}

/** A child's evidence, newest first. The projection in `lib/mastery.ts` folds it. */
export async function readLearningEvents(childId: string, since?: Date) {
  if (!uuid(childId)) return [] as LearningEventRow[];
  const { data, error } = await createAdminClient().rpc('cq_events', {
    p_parent: parentId(), p_child: childId,
    p_since: since ? since.toISOString() : null, p_limit: 20000,
  });
  if (error) throw new Error(`Learning history read failed (${error.code}).`);
  return (data ?? []) as LearningEventRow[];
}

/** The row shape `cq_events` returns: snake_case, straight from the column names. */
export type LearningEventRow = {
  id: string;
  session_id: string;
  occurred_at: string;
  skill_id: string;
  item_id: string;
  lesson_id: string | null;
  episode_id: string | null;
  verb: LearningEvent['verb'];
  phase: LearningEvent['phase'];
  correct: boolean;
  support: LearningEvent['support'];
  distractor: string | null;
  error_kind: LearningEvent['errorKind'];
  latency_ms: number | null;
  catalogue_ver: string;
};
export function uuid(value?: string) { return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null; }
export type ExplorerRow = { data: string; revision: number };
export async function readExplorer(id: string) { return uuid(id) ? read<ExplorerRow | null>('explorer', { child: id }) : null; }
export function listExplorers() { return read<ExplorerRow[]>('explorers'); }
export function createExplorer(profile: ExplorerProfile) { return commit<boolean>('create-explorer', { profile }); }
export function deleteExplorer(id: string, revision: number) { return commit<boolean>('delete-explorer', { id, revision }); }
export function saveExplorers(
  profiles: {profile: ExplorerProfile; revision: number}[],
  reset = false,
  attempt: unknown = null,
  events: readonly LearningEvent[] = [],
) {
  const payload = { profiles, reset, attempt };
  // The child whose evidence this is: the quest route saves at most one learner's
  // attempt per request, even when Team Quest writes two profiles at once.
  const child = profiles.length === 1 ? profiles[0].profile.id
    : (attempt as {childId?: string} | null)?.childId;
  return child && events.length
    ? commitWithEvents<boolean>('save-explorers', payload, child, events)
    : commit<boolean>('save-explorers', payload);
}
const catalogs = new Map<string,{expires:number;value:Promise<unknown>}>();
export async function catalog<T>(name: string): Promise<T> {
  parentId(); // Even cached curriculum is only served inside an authenticated request.
  let cached=catalogs.get(name);
  if(!cached || cached.expires<Date.now()) {
    cached={expires:Date.now()+300000,value:read<T>('catalog',{filter:name})};catalogs.set(name,cached);
    cached.value.catch(()=>catalogs.delete(name));
  }
  return structuredClone(await cached.value) as T;
}

/**
 * The published catalogue, cached per server instance.
 *
 * One row read rather than a six-way join, because `content.cq_catalogue` returns a
 * snapshot that was assembled at publish time. The five-minute window is the same one
 * `catalog()` uses; a publish is not expected to reach every child instantly, and an
 * author who needs to see their change now has the studio preview, which reads the
 * working set rather than this.
 *
 * A failure here is deliberately not fatal. If the catalogue cannot be read, or reads
 * back as something that is not a catalogue, the app falls back to the bundled bank —
 * a worse catalogue than the published one, and a far better outcome than every family
 * losing their session to a 503.
 */
let publishedCache: { expires: number; value: Promise<PublishedCatalogue | null> } | null = null;

export async function publishedCatalogue(): Promise<PublishedCatalogue | null> {
  parentId(); // Even cached curriculum is only served inside an authenticated request.
  if (!publishedCache || publishedCache.expires < Date.now()) {
    const value = loadPublishedCatalogue();
    publishedCache = { expires: Date.now() + 300000, value };
    value.catch(() => { publishedCache = null; });
  }
  return publishedCache.value;
}

async function loadPublishedCatalogue(): Promise<PublishedCatalogue | null> {
  const { data, error } = await createAdminClient().rpc('cq_catalogue', { p_version: null });
  if (error || !data) return null;
  const row = data as { version?: number; label?: string; snapshot?: unknown };
  const snapshot = readSnapshot(row.snapshot);
  if (!snapshot) return null;
  return {
    version: catalogueVersion({ version: row.version ?? null }),
    label: row.label ?? 'published',
    questions: questionsFromSnapshot(snapshot),
    skills: snapshot.skills,
    lessons: snapshot.lessons,
  };
}

/** Drop the cached catalogue, so a publish from the studio is visible without a wait. */
export function forgetPublishedCatalogue() { publishedCache = null; }

/**
 * The activity catalogue the server will serve, and the version to record against it.
 *
 * Order of preference, and why:
 *
 *   1. `content.catalogue_versions` — the published snapshot (WP-05). Gated on
 *      `reviewStatus = 'published'` at publish time and again in `questionsFromSnapshot`,
 *      so unreviewed work is unreachable by construction rather than by convention.
 *   2. `private.catalogs` — the pre-WP-05 blob, for a database that has the old
 *      migrations and not the new ones.
 *   3. `lib/curriculum.ts` — the bundle, so a fresh database still teaches something.
 *
 * Items that exist in code and not in the served catalogue are merged in at every level
 * below the first. That tolerance was added because a deploy could ship activities ahead
 * of its catalogue refresh and then recommend an id the server could not resolve. It is
 * deliberately *not* applied to the published snapshot: once content is authored in the
 * database, code silently adding to it would put unreviewed material in front of a
 * child, which is the exact thing §C4's gate exists to prevent.
 */
export async function activityCatalogue(): Promise<{ questions: Question[]; version: string }> {
  const live = await publishedCatalogue().catch(() => null);
  if (live?.questions.length) return { questions: live.questions, version: live.version };

  const legacy = await catalog<Question[]>('questions').catch(() => [] as Question[]);
  if (!legacy.length) return { questions: authoredQuestions, version: CODE_CATALOGUE_VERSION };
  const byId = new Map(authoredQuestions.map((question) => [question.id, question]));
  for (const question of legacy) byId.set(question.id, question);
  return { questions: [...byId.values()], version: CODE_CATALOGUE_VERSION };
}

// ---------------------------------------------------------------------------
// Authoring (WP-05)
// ---------------------------------------------------------------------------

/**
 * Read from the studio's side of the catalogue.
 *
 * Authorship is checked in the database, not here, so that a second caller cannot
 * forget to. `Not a catalogue author` comes back as a thrown error and the route turns
 * it into a 403.
 */
export async function contentRead<T>(kind: string, options: {
  id?: string; filter?: Record<string, unknown>; limit?: number; offset?: number;
} = {}): Promise<T> {
  const { data, error } = await createAdminClient().rpc('cq_content_read', {
    p_parent: parentId(), p_kind: kind, p_id: options.id ?? null,
    p_filter: (options.filter ?? null) as Json,
    p_limit: options.limit ?? 100, p_offset: options.offset ?? 0,
  });
  if (error) throw new ContentError(error.message);
  return data as T;
}

export async function contentWrite<T>(kind: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await createAdminClient().rpc('cq_content_write', {
    p_parent: parentId(), p_kind: kind, p_data: payload as Json,
  });
  if (error) throw new ContentError(error.message);
  // A publish that nobody can see is not a publish. The cache is per instance, so this
  // is a courtesy to the author's own next request rather than a distributed guarantee.
  if (kind === 'publish' || kind === 'rollback') forgetPublishedCatalogue();
  return data as T;
}

/** Carries the database's own sentence, which the studio shows to the author verbatim. */
export class ContentError extends Error {
  readonly authorised: boolean;
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
    this.authorised = !/not a catalogue author/i.test(message);
  }
}

export async function isCatalogueAuthor() {
  try {
    await contentRead('overview');
    return true;
  } catch (cause) {
    if (cause instanceof ContentError && !cause.authorised) return false;
    throw cause;
  }
}

// ---------------------------------------------------------------------------
// Mastery from events (WP-06)
// ---------------------------------------------------------------------------

/**
 * Every child's evidence, in one round trip, keyed by child id.
 *
 * `cq_events` reads one child. Projecting on read means folding a whole history per
 * profile, and a family of four would otherwise pay four sequential round trips on
 * every page load. The cap is per child, so one prolific sibling cannot crowd out
 * another's history and silently understate their mastery.
 */
export async function familyEvents(limit = 8000): Promise<Record<string, LearningEventRow[]>> {
  const { data, error } = await createAdminClient().rpc('cq_family_events', {
    p_parent: parentId(), p_limit: limit,
  });
  if (error) throw new Error(`Learning history read failed (${error.code}).`);
  return (data ?? {}) as Record<string, LearningEventRow[]>;
}

/**
 * The projection, per child, as the rest of the app already consumes mastery.
 *
 * This is the WP-06 switch. `profile.skillMastery` used to be whatever the blob said;
 * it is now folded out of `learning_events` on every read. The recommender
 * (`lib/recommendation.ts`) and the parent surface both read that field, so both move
 * to the projection through this one seam rather than through a change each.
 *
 * A read failure returns an empty map and the caller keeps the blob. The projection
 * being unavailable must not empty a child's history in front of their parent — the
 * blob is a cache of exactly this, and a slightly stale cache beats a blank screen.
 *
 * One known difference from the blob it replaces: `learning_events` has no column for
 * the engine an item used or its context tags, so the projection's `confidence` counts
 * representation variety from the default rather than from the real engine kind. The
 * *evidence* legs — verbs, spacing, consecutive independence — are all columns, so the
 * `practising`/`mastered` judgement is unaffected. Confidence reads slightly low until
 * the stream carries the kind; it is never overstated, which is the direction that
 * matters.
 */
export async function masteryForFamily(now = new Date()): Promise<Record<string, SkillMasteryMap>> {
  let rows: Record<string, LearningEventRow[]>;
  try {
    rows = await familyEvents();
  } catch {
    return {};
  }
  return Object.fromEntries(
    Object.entries(rows).map(([childId, events]) => [
      childId,
      masteryFromEvents(events.map(eventFromRow), now),
    ]),
  );
}

/**
 * Write a rebuilt projection back into the blob.
 *
 * The blob is a cache now. This is the write half of that claim: after a rebuild it
 * holds exactly what the projection produced, so the two can be compared and the cache
 * can be thrown away without losing anything. It deliberately does not bump the row's
 * revision — see the migration for why a cache refresh may never fail a family's save.
 */
export async function cacheMastery(childId: string, mastery: SkillMasteryMap) {
  if (!uuid(childId)) return 0;
  const { data, error } = await createAdminClient().rpc('cq_mastery_cache', {
    p_parent: parentId(), p_child: childId, p_mastery: mastery as unknown as Json,
  });
  if (error) throw new Error(`Mastery cache write failed (${error.code}).`);
  return (data as { updated?: number } | null)?.updated ?? 0;
}

/** Items whose wrong answers cluster on one distractor (§WP-06.2). Authors only. */
export async function itemHealth(options: { minWrong?: number; limit?: number } = {}) {
  const { data, error } = await createAdminClient().rpc('cq_insights', {
    p_parent: parentId(), p_kind: 'item-health', p_child: null, p_days: 14,
    p_min_attempts: options.minWrong ?? MIN_WRONG_ANSWERS, p_limit: options.limit ?? 100,
  });
  if (error) throw new ContentError(error.message);
  return (data ?? []) as ItemHealth[];
}

/** How much of what a child learned is still there `days` later (§WP-06.3). */
export async function retention(childId?: string, days = 14): Promise<Retention> {
  const { data, error } = await createAdminClient().rpc('cq_insights', {
    p_parent: parentId(), p_kind: 'retention', p_child: uuid(childId) ?? null,
    p_days: days, p_min_attempts: 5, p_limit: 100,
  });
  if (error) throw new Error(`Retention read failed (${error.code}).`);
  return (data as Retention | null) ?? emptyRetention(days);
}

/**
 * One child's mastery, with the projection authoritative wherever the stream reaches.
 *
 * Not a straight replacement, and this is the one judgement in WP-06 that is not
 * mechanical. `learning_events` began at WP-01. A family who played before that has
 * mastery in the blob which no event can reproduce, and switching reads to a bare
 * projection would erase that history from their parent report — the product silently
 * forgetting what a child did is a worse fault than the blob being unauditable.
 *
 * So: the projection wins for every skill the stream has an opinion about, and the blob
 * survives for skills it has never seen. Every new attempt writes an event, so the
 * blob-only residue can only shrink. `scripts/rebuild-mastery.mjs --report` prints how
 * much of it is left, which is the number that says when this merge can be deleted.
 */
export function withProjectedMastery(
  profile: ExplorerProfile,
  projected: Record<string, SkillMasteryMap>,
): ExplorerProfile {
  const mastery = projected[profile.id];
  if (!mastery) return profile;
  return { ...profile, skillMastery: { ...profile.skillMastery, ...mastery } };
}

/** Skills the blob claims that the event stream cannot account for. */
export function unexplainedSkills(profile: ExplorerProfile, mastery: SkillMasteryMap): string[] {
  return Object.keys(profile.skillMastery).filter((skillId) => !(skillId in mastery));
}

/**
 * One child's projected mastery.
 *
 * The quest route calls this at the moment a quest is *selected*, rather than on every
 * answer. Selection is where the recommender consults mastery (§WP-06 acceptance), and
 * reading a whole history on each of a child's twelve taps would buy nothing: the
 * events written during a session are the ones `recordAttempt` has already folded into
 * the profile in memory.
 */
export async function masteryForChild(childId: string, now = new Date()): Promise<SkillMasteryMap | null> {
  if (!uuid(childId)) return null;
  try {
    const rows = await readLearningEvents(childId);
    return masteryFromEvents(rows.map(eventFromRow), now);
  } catch {
    // The blob is a cache of exactly this. A recommender that falls back to it picks
    // slightly staler activities; one that throws ends the child's session.
    return null;
  }
}
