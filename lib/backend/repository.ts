import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { parentId } from './context';
import type { Json } from '@/lib/supabase/database.types';
import type { ExplorerProfile } from '@/lib/explorers';
import { questions as authoredQuestions, type Question } from '@/lib/curriculum';
import { validEvents, type LearningEvent } from '@/lib/learning-events';

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
 * The activity catalogue the server will serve.
 *
 * The published catalogue in `private.catalogs` stays authoritative — it is what an
 * eventual admin surface will edit, and anything it defines wins. But an activity that
 * exists in code and not yet in the database is still served, rather than being
 * unreachable until someone runs a SQL refresh.
 *
 * Without this, a deploy that shipped new activities ahead of its catalogue refresh
 * could recommend an id the server could not resolve. The refresh is still the right
 * thing to run; it just stops being a hard gate between writing content and a child
 * reaching it.
 */
export async function activityCatalogue(): Promise<Question[]> {
  const published = await catalog<Question[]>('questions').catch(() => [] as Question[]);
  if (!published.length) return authoredQuestions;
  const byId = new Map(authoredQuestions.map((question) => [question.id, question]));
  for (const question of published) byId.set(question.id, question);
  return [...byId.values()];
}
