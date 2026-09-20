-- WP-01: the learning event stream.
--
-- Until now the only durable record of what a child did was a JSON blob mutated in
-- place on `private.explorer_state`, plus `private.raw_attempts`, which stores whatever
-- shape the caller happened to send. Neither can answer the questions an adaptive
-- product has to ask: which skills do children fail most often, does mastering blending
-- here predict success there, which item is badly written. Not with better SQL — at all.
--
-- This table is append-only. One row per attempt, never updated, deleted only by the
-- retention policy. Mastery becomes a projection over it; the JSON blob demotes to a
-- cache. Events not recorded are gone forever, which is why this lands before the
-- redesign rather than after it.
--
-- The blueprint (§C1) writes `references public.explorers(id)`. The real table in this
-- schema is `public.child_profiles`; `explorers` is the application's name for the same
-- thing. The foreign key points at the table that exists.
begin;

create table if not exists public.learning_events (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.child_profiles(id) on delete cascade,
  session_id    text not null check (char_length(session_id) between 1 and 64),
  occurred_at   timestamptz not null default now(),

  skill_id      text not null check (char_length(skill_id) between 1 and 120),
  item_id       text not null check (char_length(item_id) between 1 and 120),
  lesson_id     text check (char_length(lesson_id) <= 120),
  episode_id    text check (char_length(episode_id) <= 120),

  -- The taxonomy that replaces "a correct tap is evidence of learning". `choose` is
  -- the weakest of these and the one the content plan is shrinking.
  verb          text not null check (verb in
                  ('say','build','sequence','sort','predict','fix','explain','make','choose')),
  phase         text not null check (phase in ('discover','guided','independent','transfer')),
  correct       boolean not null,
  -- How much help was standing when the answer was given. `none` is what the evidence
  -- rule (§C2) requires twice in a row before a skill can be called mastered.
  support       text not null check (support in ('none','hint','model','scaffold','adult')),
  distractor    text check (char_length(distractor) <= 400),
  -- Why the wrong answer was wrong (§C3). This is what lets feedback, hint selection
  -- and the next item branch on the misconception rather than on the score.
  error_kind    text check (error_kind in
                  ('confusable-visual','confusable-sound','letter-name-for-sound','off-by-one',
                   'wrong-attribute','sequence-reversed','guess','not-yet-taught')),
  latency_ms    integer check (latency_ms >= 0 and latency_ms <= 3600000),
  catalogue_ver text not null check (char_length(catalogue_ver) between 1 and 64),

  -- An error kind only means something on a wrong answer.
  constraint learning_events_error_only_when_wrong check (correct = false or error_kind is null)
);

create index if not exists learning_events_child_time on public.learning_events (child_id, occurred_at desc);
create index if not exists learning_events_skill      on public.learning_events (skill_id, occurred_at desc);
create index if not exists learning_events_item       on public.learning_events (item_id);
-- Item health (WP-06) counts distractors per item; this keeps that scan off the heap.
create index if not exists learning_events_item_wrong on public.learning_events (item_id, distractor)
  where correct = false;

comment on table public.learning_events is
  'Append-only evidence of every learning attempt. Never updated. Deleted only by the retention policy.';

-- Append-only is enforced, not merely intended: a bug or a future migration cannot
-- quietly rewrite history. Deletion stays available for the retention policy and for
-- the cascade when a family deletes a child.
create or replace function private.cq_events_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'learning_events is append-only';
end $$;

drop trigger if exists learning_events_no_update on public.learning_events;
create trigger learning_events_no_update before update on public.learning_events
  for each row execute function private.cq_events_append_only();

alter table public.learning_events enable row level security;
revoke all on table public.learning_events from public, anon, authenticated;
grant select on table public.learning_events to authenticated;

-- A parent reads their own family's rows and nobody else's. There is deliberately no
-- insert, update or delete policy: writes arrive only through the security-definer
-- routine below, which the server calls after it has authorised the session.
drop policy if exists family_read on public.learning_events;
create policy family_read on public.learning_events for select to authenticated
using (exists (select 1 from public.child_profiles c
               where c.id = child_id and c.parent_id = (select auth.uid())));

/**
 * Append a batch of events for one child.
 *
 * Called inside the same transaction as the profile save, so an attempt can never be
 * banked without its evidence or the reverse. `on conflict do nothing` on a
 * caller-supplied id makes replay idempotent, which is what offline queue drain
 * (WP-12) needs to avoid double-counting a session that was already flushed.
 */
create or replace function private.cq_append_events(p_child uuid, p_events jsonb)
returns integer language plpgsql set search_path = '' as $$
declare inserted integer;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) = 0 then
    return 0;
  end if;
  if jsonb_array_length(p_events) > 200 then raise exception 'Too many events in one batch'; end if;

  with incoming as (
    select
      coalesce((e->>'id')::uuid, gen_random_uuid())        as id,
      p_child                                              as child_id,
      e->>'sessionId'                                      as session_id,
      coalesce((e->>'occurredAt')::timestamptz, now())     as occurred_at,
      e->>'skillId'                                        as skill_id,
      e->>'itemId'                                         as item_id,
      nullif(e->>'lessonId', '')                           as lesson_id,
      nullif(e->>'episodeId', '')                          as episode_id,
      e->>'verb'                                           as verb,
      e->>'phase'                                          as phase,
      (e->>'correct')::boolean                             as correct,
      e->>'support'                                        as support,
      nullif(e->>'distractor', '')                         as distractor,
      nullif(e->>'errorKind', '')                          as error_kind,
      (e->>'latencyMs')::integer                           as latency_ms,
      e->>'catalogueVersion'                               as catalogue_ver
    from jsonb_array_elements(p_events) as e
  )
  insert into public.learning_events (
    id, child_id, session_id, occurred_at, skill_id, item_id, lesson_id, episode_id,
    verb, phase, correct, support, distractor, error_kind, latency_ms, catalogue_ver)
  select id, child_id, session_id, occurred_at, skill_id, item_id, lesson_id, episode_id,
         verb, phase, correct, support,
         -- A distractor and an error kind describe a wrong answer. Drop them on a
         -- correct one rather than failing the batch: the check constraint would
         -- otherwise reject a whole offline queue over one sloppy client row.
         case when correct then null else distractor end,
         case when correct then null else error_kind end,
         latency_ms, catalogue_ver
  from incoming
  on conflict (id) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end $$;

/**
 * Stop a catalogue-refresh lag from costing a child their session.
 *
 * `cq_record_attempt` resolved an attempt's `questionSlug` against `public.questions`
 * and raised 'Activity catalog is missing' when it found nothing. The application layer
 * deliberately serves activities that exist in code but not yet in the published
 * catalogue (see `activityCatalogue`), so a child could be legitimately shown a question
 * that this function then refused to record — turning the whole save into a 503 and
 * losing their progress for that answer.
 *
 * At the time of writing the code bank held 523 questions against roughly 390 seeded
 * rows, so this fired intermittently depending on which items the recommender chose.
 *
 * The fix follows the rule the repository already states: a refresh is still the right
 * thing to run, but it is not a gate between a child answering and their work being
 * saved. An unresolvable slug now falls through to the same runtime-activity path used
 * by engines that have no catalogue entry at all, keeping the audit trail intact.
 * `learning_events` never had this coupling — `item_id` is free text by design.
 */
-- The runtime fallback lesson existed for 'reading' and 'experience' but never for
-- 'classic', which is the domain the daily quest and every game mission record under.
-- That is why the branch below was unreachable for quests and the function raised
-- instead. Seeded against the same adaptive unit as its two siblings.
insert into public.lessons(id, unit_id, slug, title, published)
select 'c1a5f10c-0000-4000-8000-000000000001', u.id, 'runtime-classic', 'Adaptive quest', false
from public.units u
join public.lessons l on l.slug = 'runtime-reading' and l.unit_id = u.id
limit 1
on conflict (id) do nothing;

create or replace function private.cq_record_attempt(p_child uuid, a jsonb, p_domain text)
returns void language plpgsql set search_path='' as $$
declare activity uuid; question uuid; lesson uuid; sid uuid;
begin
 if a is null or a='null'::jsonb then return; end if;
 sid:=(a->>'sessionId')::uuid;
 insert into public.learning_sessions(id,child_id,kind) values(sid,p_child,p_domain) on conflict(id) do nothing;
 if not exists(select 1 from public.learning_sessions where id=sid and child_id=p_child) then raise exception 'Session owner mismatch'; end if;
 if a->>'questionSlug' is not null then
  select q.id,q.activity_id into question,activity from public.questions q where q.slug=a->>'questionSlug' order by q.id limit 1;
 end if;
 if activity is null then
  -- Either no slug was given, or the published catalogue has not caught up with the
  -- code yet. Record it against a per-session runtime activity rather than refusing.
  question:=null;
  select id into lesson from public.lessons where slug='runtime-'||p_domain limit 1;
  if lesson is null then raise exception 'Activity catalog is missing'; end if;
  activity:=md5(p_child::text||sid::text||coalesce(a->>'activityId',a->>'questionSlug',''))::uuid;
  insert into public.activities(id,lesson_id,slug,engine_kind,published)
  values(activity,lesson,sid::text||':'||coalesce(a->>'activityId',a->>'questionSlug',''),coalesce(a->>'kind',p_domain),false)
  on conflict(id) do nothing;
 end if;
 insert into public.activity_attempts(id,child_id,session_id,activity_id,question_id,mutation_id,response,correct,help_level,attempt_number,response_time_ms,evidence,created_at)
 values((a->>'id')::uuid,p_child,sid,activity,question,(a->>'id')::uuid,coalesce(a->'response','null'),
 (a->>'correct')::boolean,coalesce((a->>'helpLevel')::int,0),(a->>'attemptNumber')::int,
 (a->>'responseTimeMs')::int,jsonb_build_object('kind',a->'evidence','skillId',a->'skillId','errorType',a->'errorType'),(a->>'createdAt')::timestamptz);
 insert into private.raw_attempts(id,child_id,domain,data) values((a->>'id')::uuid,p_child,p_domain,a);
end $$;

/**
 * Commit family state and append the evidence it produced, in one transaction.
 *
 * `cq_commit` is left exactly as it is rather than being copied into this migration
 * with an extra parameter; a hundred lines of duplicated state machine would drift.
 * A function call runs inside the caller's transaction, so if the append fails the
 * whole save rolls back, and an interaction can never be banked without its evidence.
 *
 * `cq_commit` signals a lost optimistic-concurrency race by returning `false` rather
 * than raising. Events are appended only when the write actually landed, so a losing
 * writer does not leave orphan evidence for a profile change that was discarded.
 */
create or replace function public.cq_commit_events(
  p_parent uuid, p_kind text, p_data jsonb, p_child uuid, p_events jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb; appended integer := 0;
begin
  result := public.cq_commit(p_parent, p_kind, p_data);
  if result is null or result = 'false'::jsonb
     or coalesce((result->>'status')::integer, 200) >= 400 then
    return result;
  end if;
  if p_child is not null then
    if not exists (select 1 from public.child_profiles
                   where id = p_child and parent_id = p_parent) then
      raise exception 'Child does not belong to this family';
    end if;
    appended := private.cq_append_events(p_child, p_events);
  end if;
  if jsonb_typeof(result) = 'object' then
    return result || jsonb_build_object('eventsAppended', appended);
  end if;
  return result;
end $$;

/**
 * A child's evidence, newest first.
 *
 * The projection that replaces the mastery blob (`lib/mastery.ts`) folds these in
 * TypeScript rather than SQL, so the evidence rule (§C2) lives in one place and can be
 * tested without a database. The cap is a safety rail, not a paging scheme; a child in
 * this age band produces on the order of a hundred events a week.
 */
create or replace function public.cq_events(
  p_parent uuid, p_child uuid, p_since timestamptz default null, p_limit integer default 20000)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_parent is null then raise exception 'Parent required'; end if;
  if not exists (select 1 from public.child_profiles where id = p_child and parent_id = p_parent)
    then return '[]'::jsonb; end if;
  return (
    select coalesce(jsonb_agg(row_to_json(e) order by e.occurred_at desc, e.id), '[]')
    from (
      select id, session_id, occurred_at, skill_id, item_id, lesson_id, episode_id,
             verb, phase, correct, support, distractor, error_kind, latency_ms, catalogue_ver
      from public.learning_events
      where child_id = p_child and (p_since is null or occurred_at >= p_since)
      order by occurred_at desc, id
      limit least(greatest(p_limit, 1), 20000)
    ) e);
end $$;

-- Same posture as every other privileged routine here: the Data API cannot reach them
-- even with a valid parent JWT. Only the guarded server repositories, holding the
-- secret key, may call them.
revoke all on function public.cq_commit_events(uuid,text,jsonb,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.cq_events(uuid,uuid,timestamptz,integer) from public, anon, authenticated;
revoke all on function private.cq_append_events(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.cq_commit_events(uuid,text,jsonb,uuid,jsonb) to service_role;
grant execute on function public.cq_events(uuid,uuid,timestamptz,integer) to service_role;

update private.backend_metadata set version = '202609200003';
commit;
