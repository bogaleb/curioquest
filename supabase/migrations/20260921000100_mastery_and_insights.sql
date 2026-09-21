-- WP-06: mastery from events.
--
-- WP-01 built the event stream and proved the projection matched the blob. This
-- migration is what lets the application stop asking the blob. Three routines:
--
--   1. `cq_family_events` — every child's evidence in one round trip. Projecting on
--      read means folding a child's whole history on every profile load; doing that as
--      one query per child turned a page view into four sequential round trips.
--   2. `cq_mastery_cache` — write a rebuilt projection back into the blob. The blob
--      stops being the source of truth and becomes a cache that can be thrown away.
--   3. `cq_insights` — the two questions §WP-06 asks the stream that the blob could
--      never answer: which item is badly written, and does anything stay learnt.
--
-- Nothing here computes mastery. The evidence rule (§C2) lives in
-- `lib/evidence-rule.ts` and the fold in `lib/mastery-projection.ts`, and a second
-- implementation in plpgsql would drift from it within a release. What SQL does here is
-- what only SQL can: aggregate across children and across families cheaply.
begin;

-- ---------------------------------------------------------------------------
-- Reading the stream
-- ---------------------------------------------------------------------------

/**
 * Every child's events, grouped by child.
 *
 * Oldest first, because that is the order the projection folds in; sorting again in
 * TypeScript is cheap but pointless. The per-child cap is applied *per child* rather
 * than across the family, so one prolific sibling cannot starve another's history and
 * silently understate their mastery.
 */
create or replace function public.cq_family_events(p_parent uuid, p_limit integer default 8000)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare lim integer := least(greatest(coalesce(p_limit, 8000), 1), 20000);
begin
  if p_parent is null then raise exception 'Parent required'; end if;
  return coalesce((
    select jsonb_object_agg(child, events)
    from (
      select c.id::text as child,
             coalesce((
               select jsonb_agg(to_jsonb(e) order by e.occurred_at, e.id)
               from (
                 select id, session_id, occurred_at, skill_id, item_id, lesson_id, episode_id,
                        verb, phase, correct, support, distractor, error_kind, latency_ms, catalogue_ver
                 from public.learning_events
                 where child_id = c.id
                 order by occurred_at desc, id
                 limit lim
               ) e), '[]') as events
      from public.child_profiles c
      where c.parent_id = p_parent
    ) grouped
  ), '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- The blob, demoted
-- ---------------------------------------------------------------------------

/**
 * Write a rebuilt projection into the cached blob.
 *
 * Deliberately does **not** bump `revision`. The revision guards the state a family
 * edits — a profile name, a saved session — against two tabs overwriting each other.
 * `skillMastery` is derived: if a concurrent save writes a stale copy over this one,
 * the next read reprojects and corrects it, whereas bumping the revision would fail
 * that save and lose a child's answer to a cache refresh. A cache may never cost
 * somebody their work.
 *
 * Called by `scripts/rebuild-mastery.mjs`, which talks to this function directly
 * rather than through the repository: it runs outside Next and cannot import
 * `server-only` code.
 */
create or replace function public.cq_mastery_cache(p_parent uuid, p_child uuid, p_mastery jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare touched integer := 0;
begin
  if p_parent is null then raise exception 'Parent required'; end if;
  if p_mastery is null or jsonb_typeof(p_mastery) <> 'object' then
    raise exception 'A mastery map is required';
  end if;
  if not exists (select 1 from public.child_profiles where id = p_child and parent_id = p_parent) then
    return jsonb_build_object('updated', 0);
  end if;

  update private.explorer_state
  set data = jsonb_set(data, '{skillMastery}', p_mastery, true)
  where child_id = p_child
    -- Nothing to do when the cache already agrees. Skipping the write keeps the
    -- reconciliation on read free in the common case, which is every case after the
    -- first correct rebuild.
    and coalesce(data->'skillMastery', 'null'::jsonb) is distinct from p_mastery;
  get diagnostics touched = row_count;
  return jsonb_build_object('updated', touched);
end $$;

-- ---------------------------------------------------------------------------
-- Insights
-- ---------------------------------------------------------------------------

/**
 * The two questions the blob could never answer.
 *
 * `item-health` is a property of the *catalogue*, not of a family, so it aggregates
 * across every child and is gated on catalogue authorship rather than on parenthood.
 * `retention` is a property of a family's own children and is gated on the parent.
 * Mixing the two scopes behind one permission would either leak one family's data to
 * another or hide the content signal from the only people who can act on it.
 */
create or replace function public.cq_insights(
  p_parent uuid, p_kind text, p_child uuid default null, p_days integer default 14,
  p_min_attempts integer default 5, p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 100), 1), 500);
  window_days integer := least(greatest(coalesce(p_days, 14), 1), 365);
  floor_attempts integer := least(greatest(coalesce(p_min_attempts, 5), 1), 100);
begin
  if p_parent is null then raise exception 'Parent required'; end if;

  -- ---- item health -------------------------------------------------------
  --
  -- One distractor taking most of the wrong answers is the signature of a badly
  -- written item: either it is indistinguishable from the answer, or it encodes a
  -- misconception the lesson never addressed. Both are content bugs, and neither is
  -- visible from a score. §WP-06 puts the threshold at 60%.
  if p_kind = 'item-health' then
    if not content.cq_is_author(p_parent) then raise exception 'Not a catalogue author'; end if;
    return (
      with wrong as (
        select item_id, skill_id, coalesce(distractor, '(no answer recorded)') as distractor,
               count(*) as picks
        from public.learning_events
        where not correct
        group by 1, 2, 3
      ),
      totals as (
        select item_id, skill_id, sum(picks) as wrong_total,
               max(picks) as top_picks,
               (array_agg(distractor order by picks desc, distractor))[1] as top_distractor
        from wrong group by 1, 2
      ),
      attempts as (
        select item_id, count(*) as attempt_total,
               count(*) filter (where correct) as correct_total
        from public.learning_events group by 1
      )
      select coalesce(jsonb_agg(entry order by share desc, wrong_total desc), '[]') from (
        select
          (t.top_picks::numeric / t.wrong_total) as share,
          t.wrong_total,
          jsonb_build_object(
          'itemId', t.item_id,
          'skillId', t.skill_id,
          'prompt', (select i.prompt->>'en' from content.items i where i.id = t.item_id),
          'reviewStatus', (select i.review_status from content.items i where i.id = t.item_id),
          'attempts', a.attempt_total,
          'correct', a.correct_total,
          'wrong', t.wrong_total,
          'topDistractor', t.top_distractor,
          'topPicks', t.top_picks,
          'share', round(t.top_picks::numeric / t.wrong_total, 3),
          -- The reason an author wrote for that distractor, when there is one. An item
          -- whose dominant wrong answer already has an authored reason is a different
          -- problem from one where nobody has looked.
          'errorKind', (select d.error_kind from content.item_distractors d
                        where d.item_id = t.item_id and d.value = t.top_distractor),
          'reviewed', coalesce((select d.reviewed from content.item_distractors d
                                where d.item_id = t.item_id and d.value = t.top_distractor), false)
        ) as entry
        from totals t join attempts a on a.item_id = t.item_id
        where t.wrong_total >= floor_attempts
        order by share desc, t.wrong_total desc
        limit lim
      ) ranked);

  -- ---- retention ---------------------------------------------------------
  --
  -- "Still correct after 14 days" is the only question whose answer a parent cannot
  -- get from a session summary, and the one the product's whole spaced-practice claim
  -- rests on. A skill counts only once it has actually been revisited that late; a
  -- skill nobody has come back to is neither retained nor forgotten, and counting it
  -- either way would be a number about the schedule rather than about the child.
  elsif p_kind = 'retention' then
    if p_child is not null and not exists (
      select 1 from public.child_profiles where id = p_child and parent_id = p_parent
    ) then return null; end if;

    return (
      with mine as (
        select e.* from public.learning_events e
        join public.child_profiles c on c.id = e.child_id
        where c.parent_id = p_parent and (p_child is null or e.child_id = p_child)
      ),
      learned as (
        select child_id, skill_id, min(occurred_at) as learned_at
        from mine where correct group by 1, 2
      ),
      revisit as (
        select l.child_id, l.skill_id, l.learned_at, r.occurred_at as revisited_at, r.correct
        from learned l
        cross join lateral (
          select occurred_at, correct from mine m
          where m.child_id = l.child_id and m.skill_id = l.skill_id
            and m.occurred_at >= l.learned_at + make_interval(days => window_days)
          order by m.occurred_at
          limit 1
        ) r
      )
      select jsonb_build_object(
        'days', window_days,
        'skillsLearned', (select count(*) from learned),
        'skillsRevisited', (select count(*) from revisit),
        'skillsRetained', (select count(*) from revisit where correct),
        'rate', (select case when count(*) = 0 then null
                        else round((count(*) filter (where correct))::numeric / count(*), 3) end
                 from revisit),
        -- Named, not just counted: a parent asking "which one slipped" should not have
        -- to read a percentage and guess.
        'slipped', (select coalesce(jsonb_agg(jsonb_build_object(
                      'skillId', skill_id, 'childId', child_id,
                      'learnedAt', learned_at, 'revisitedAt', revisited_at)
                      order by revisited_at desc), '[]')
                    from revisit where not correct),
        'held', (select coalesce(jsonb_agg(jsonb_build_object(
                   'skillId', skill_id, 'childId', child_id,
                   'learnedAt', learned_at, 'revisitedAt', revisited_at)
                   order by revisited_at desc), '[]')
                 from revisit where correct),
        -- Learnt, but not yet seen again this late. The work the scheduler still owes.
        'awaiting', (select count(*) from learned l
                     where not exists (select 1 from revisit r
                                       where r.child_id = l.child_id and r.skill_id = l.skill_id))
      ));
  end if;

  raise exception 'Unknown insight';
end $$;

-- Same posture as every other privileged routine here: unreachable from the Data API
-- even with a valid parent JWT, callable only by the server holding the secret key.
revoke all on function public.cq_family_events(uuid,integer) from public, anon, authenticated;
revoke all on function public.cq_mastery_cache(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.cq_insights(uuid,text,uuid,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.cq_family_events(uuid,integer) to service_role;
grant execute on function public.cq_mastery_cache(uuid,uuid,jsonb) to service_role;
grant execute on function public.cq_insights(uuid,text,uuid,integer,integer,integer) to service_role;

update private.backend_metadata set version = '202609210001';
commit;
