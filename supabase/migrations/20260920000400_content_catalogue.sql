-- WP-05: content out of the bundle.
--
-- Every lesson this product teaches is currently a function call in `lib/curriculum.ts`.
-- Adding one means editing TypeScript, running a generator, pasting a megabyte of SQL
-- into the dashboard and shipping a deploy. That is not a content pipeline; it is a
-- developer bottleneck with a curriculum attached, and it is the reason the bank is
-- 523 mechanically generated questions across 78 skills rather than authored lessons.
--
-- This migration models §C4 relationally and makes `review_status` the serving gate.
--
-- Shape of the thing
-- ------------------
-- `content.skills`, `.lessons`, `.items`, `.item_distractors`, `.assets`, `.episodes`
-- are the *working set*: the rows an author edits, each carrying a review status.
-- Nothing in there reaches a child directly.
--
-- `content.catalogue_versions` holds immutable published *snapshots*. Publishing walks
-- the working set, takes everything marked `published`, and writes it into one jsonb
-- document with a monotonic version number. That document is what the app serves.
--
-- Snapshots rather than live queries, for four reasons:
--
--   * serving is one row read, not a six-way join per request;
--   * `learning_events.catalogue_ver` finally identifies content that cannot change
--     underneath it, so item health (WP-06) compares like with like;
--   * a publish is atomic — a child never sees half an edit;
--   * rollback is a flag move, not a restore.
--
-- The working set is where truth is authored. The snapshot is where truth is served.
--
-- Who may author
-- --------------
-- The catalogue is global: one corpus, every family. So authoring is not a parent
-- capability. `content.authors` is an explicit grant, empty on arrival, and every read
-- and write path checks it. A parent with no row there gets a refusal and nothing else.
--
-- Access posture matches every other privileged surface in this schema: RLS on, no
-- grants to `anon` or `authenticated`, and everything through security-definer
-- functions that only `service_role` may execute.
begin;

create schema if not exists content;
revoke all on schema content from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
--
-- The closed vocabularies below are check constraints rather than Postgres enum types.
-- They are mirrored in TypeScript (`lib/error-kinds.ts`, `lib/learning-events.ts`), and
-- extending a check constraint is one line in a migration that can sit alongside other
-- DDL, which adding an enum value historically could not.

create table if not exists content.authors (
  parent_id  uuid primary key references public.parents(id) on delete cascade,
  role       text not null default 'author' check (role in ('author','editor')),
  granted_at timestamptz not null default now(),
  note       text
);
comment on table content.authors is
  'Explicit grant of catalogue authoring. Empty by default: being a parent is not being an author.';

create table if not exists content.assets (
  id          text primary key check (char_length(id) between 1 and 120),
  kind        text not null check (kind in ('audio','art','animation')),
  locale      text not null default 'en' check (char_length(locale) between 2 and 12),
  uri         text not null check (char_length(uri) between 1 and 600),
  -- Not decoration. §A forbids shipping content whose rights are unclear, and the only
  -- way to keep that true at five thousand assets is to make the field mandatory at
  -- row one rather than auditing it later.
  licence     text not null check (char_length(licence) between 1 and 200),
  duration_ms integer check (duration_ms >= 0 and duration_ms <= 3600000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists content.skills (
  id              text primary key check (id ~ '^[A-Z0-9._]+$'),
  subject         text not null check (char_length(subject) between 1 and 40),
  strand          text not null check (char_length(strand) between 1 and 60),
  name            text not null check (char_length(name) between 1 and 120),
  -- What Nova calls it. §C5 forbids system vocabulary on a child surface, so the adult
  -- name and the child name are separate columns rather than one string used in both.
  child_name      text not null check (char_length(child_name) between 1 and 120),
  description     text not null check (char_length(description) between 1 and 400),
  prerequisites   text[] not null default '{}',
  bands           text[] not null default '{}' check (cardinality(bands) between 1 and 6),
  evidence_target integer not null default 5 check (evidence_target between 1 and 30),
  active          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists content_skills_subject on content.skills (subject, strand);

create table if not exists content.lessons (
  id            text primary key check (char_length(id) between 1 and 120),
  skill_id      text not null references content.skills(id) on update cascade on delete restrict,
  title         text not null check (char_length(title) between 1 and 160),
  child_title   text not null check (char_length(child_title) between 1 and 160),
  -- The worked example (§C4 `model: Step`). Null while a lesson is still only practice.
  model         jsonb,
  position      integer not null default 0 check (position between 0 and 9999),
  review_status text not null default 'draft' check (review_status in ('draft','reviewed','published')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists content_lessons_skill on content.lessons (skill_id, position);

create table if not exists content.items (
  id            text primary key check (char_length(id) between 1 and 120),
  lesson_id     text not null references content.lessons(id) on update cascade on delete cascade,
  skill_id      text not null references content.skills(id) on update cascade on delete restrict,

  -- The §C1 verb vocabulary, authored rather than inferred from the engine kind. An
  -- item knows what it asks a child to *do*; deriving that from a component name was
  -- always a guess, and it is the number §I watches most closely.
  verb          text not null check (verb in
                  ('say','build','sequence','sort','predict','fix','explain','make','choose')),
  phase         text not null default 'independent'
                  check (phase in ('discover','guided','independent','transfer')),
  bands         text[] not null default '{}' check (cardinality(bands) between 1 and 6),

  -- Localised text. `en` is required by the publish validator rather than by the column,
  -- so a half-translated row can still be saved as a draft.
  prompt        jsonb not null,
  hint          jsonb not null default '{}'::jsonb,
  explanation   jsonb not null default '{}'::jsonb,
  -- Empty for an engine item: a sorting board or a number bond computes correctness
  -- from its finished state, and 112 of the migrated items do exactly that. The publish
  -- validator requires an answer for everything else.
  answer        text not null default '' check (char_length(answer) <= 400),

  assets        jsonb not null default '[]'::jsonb,
  -- Engine configuration, context tags, difficulty rung: how the item is delivered
  -- rather than what it teaches. Carried as the runtime `Question` fields verbatim so
  -- the engines in `components/learning/` need no change (§J: extend, don't replace).
  delivery      jsonb not null default '{}'::jsonb,

  review_status text not null default 'draft' check (review_status in ('draft','reviewed','published')),
  -- Provenance, so the studio can tell fourteen hundred generated rows from authored
  -- ones without guessing from the id.
  source        text not null default 'authored' check (source in ('authored','generated','imported')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.parents(id) on delete set null
);
create index if not exists content_items_lesson on content.items (lesson_id);
create index if not exists content_items_skill  on content.items (skill_id);
create index if not exists content_items_status on content.items (review_status);

-- Every wrong answer an author writes, with the reason it is wrong (§C3).
--
-- A table rather than a jsonb array, because this is the column the product most needs
-- to query: how many distractors still carry a machine's guess, which misconception is
-- most common in phonics, show me every off-by-one in the bank. Those are the questions
-- that turn a bank into a curriculum, and they are unaskable against a nested array.
create table if not exists content.item_distractors (
  item_id    text not null references content.items(id) on update cascade on delete cascade,
  value      text not null check (char_length(value) between 1 and 400),
  -- Null means nobody has said yet, and that is deliberately expressible.
  --
  -- §C3 wants every wrong answer to carry a reason, and the validator pushes the
  -- catalogue towards that. But the WP-04 inference has an opinion about only 82 of the
  -- 428 wrong answers in the migrated bank, and writing `guess` over the other 346 would
  -- be a lie the product then acts on: `guess` is one of the two kinds that never counts
  -- against a mastery score, so mislabelling here would quietly stop recording real
  -- misconceptions. An absent reason falls through to the runtime inference exactly as
  -- it does today, and shows up in the studio as work rather than as a finished row.
  error_kind text check (error_kind is null or error_kind in
               ('confusable-visual','confusable-sound','letter-name-for-sound','off-by-one',
                'wrong-attribute','sequence-reversed','guess','not-yet-taught')),
  -- True only where a person chose the reason. `lib/distractor-reasons.ts` inferring one
  -- is a starting position, not authorship, and this column is what keeps the difference
  -- countable instead of rhetorical.
  reviewed   boolean not null default false,
  note       text check (char_length(note) <= 400),
  position   integer not null default 0,
  primary key (item_id, value)
);
create index if not exists content_distractors_kind on content.item_distractors (error_kind)
  where reviewed = false;
-- A person cannot have reviewed a reason that was never chosen.
alter table content.item_distractors drop constraint if exists item_distractors_reviewed_has_reason;
alter table content.item_distractors add constraint item_distractors_reviewed_has_reason
  check (not reviewed or error_kind is not null);

create table if not exists content.episodes (
  id               text primary key check (char_length(id) between 1 and 120),
  title            text not null check (char_length(title) between 1 and 200),
  synopsis         text not null default '' check (char_length(synopsis) <= 1000),
  lesson_order     text[] not null default '{}',
  scenes           jsonb not null default '[]'::jsonb,
  reward_object_id text,
  review_status    text not null default 'draft' check (review_status in ('draft','reviewed','published')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table content.episodes is
  'Modelled now, filled in WP-08. An empty table is honest; a missing one would make the episode work a schema change as well as a content one.';

-- Immutable published snapshots.
--
-- `version` is what `learning_events.catalogue_ver` records as `db-<version>`. Exactly
-- one row is `is_current`, and the partial unique index makes that a database rule
-- rather than an application convention.
create table if not exists content.catalogue_versions (
  version      integer generated always as identity primary key,
  label        text not null check (char_length(label) between 1 and 120),
  snapshot     jsonb not null,
  item_count   integer not null default 0,
  skill_count  integer not null default 0,
  lesson_count integer not null default 0,
  warnings     jsonb not null default '[]'::jsonb,
  notes        text check (char_length(notes) <= 2000),
  is_current   boolean not null default false,
  published_at timestamptz not null default now(),
  published_by uuid references public.parents(id) on delete set null
);
create unique index if not exists content_versions_one_current
  on content.catalogue_versions (is_current) where is_current;

-- A published version is history. Rewriting one would silently change what a past
-- learning event was recorded against, which is the exact confusion `catalogue_ver`
-- exists to prevent. Only `is_current` and the bookkeeping columns may move.
create or replace function content.cq_versions_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.snapshot is distinct from old.snapshot
     or new.version is distinct from old.version
     or new.published_at is distinct from old.published_at then
    raise exception 'A published catalogue version cannot be rewritten';
  end if;
  return new;
end $$;

drop trigger if exists catalogue_versions_immutable on content.catalogue_versions;
create trigger catalogue_versions_immutable before update on content.catalogue_versions
  for each row execute function content.cq_versions_immutable();

create or replace function content.cq_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

do $$ declare t text;
begin
  foreach t in array array['assets','skills','lessons','items','episodes'] loop
    execute format('drop trigger if exists touch_updated on content.%I', t);
    execute format('create trigger touch_updated before update on content.%I for each row execute function content.cq_touch()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

do $$ declare t text;
begin
  foreach t in array array['authors','assets','skills','lessons','items','item_distractors','episodes','catalogue_versions'] loop
    execute format('alter table content.%I enable row level security', t);
    execute format('revoke all on table content.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- No policies are defined, on purpose. RLS with no policy denies every role that is not
-- the owner, and every legitimate path below is security definer.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function content.cq_is_author(p_parent uuid) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from content.authors where parent_id = p_parent);
$$;

-- One item, with its wrong answers, in the shape `lib/catalogue/model.ts` parses.
create or replace function content.cq_item_json(i content.items) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', i.id, 'lessonId', i.lesson_id, 'skillId', i.skill_id, 'verb', i.verb,
    'phase', i.phase, 'bands', to_jsonb(i.bands), 'prompt', i.prompt, 'hint', i.hint,
    'explanation', i.explanation, 'answer', i.answer, 'assets', i.assets,
    'delivery', i.delivery, 'reviewStatus', i.review_status,
    'distractors', (select coalesce(jsonb_agg(jsonb_build_object(
                      'value', d.value, 'errorKind', d.error_kind,
                      'reviewed', d.reviewed, 'note', d.note) order by d.position, d.value), '[]')
                    from content.item_distractors d where d.item_id = i.id));
$$;

-- The same, plus the bookkeeping an author needs and a child never does.
create or replace function content.cq_item_row(i content.items) returns jsonb
language sql stable set search_path = '' as $$
  select content.cq_item_json(i) || jsonb_build_object(
    'source', i.source, 'updatedAt', i.updated_at,
    'unreviewedReasons', (select count(*) from content.item_distractors d
                          where d.item_id = i.id and not d.reviewed));
$$;

/**
 * Assemble a catalogue document from the working set.
 *
 * `p_published_only` is the whole difference between what ships and what an author
 * sees. Both go through this one function, so the draft an author validates is
 * structurally the document that would be published.
 */
create or replace function content.cq_snapshot(p_published_only boolean default true)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'version', coalesce((select max(version) from content.catalogue_versions), 0),
    'label', 'working set',
    'skills', (select coalesce(jsonb_agg(jsonb_build_object(
                 'id', s.id, 'subject', s.subject, 'strand', s.strand, 'name', s.name,
                 'childName', s.child_name, 'description', s.description,
                 'prerequisites', to_jsonb(s.prerequisites), 'bands', to_jsonb(s.bands),
                 'evidenceTarget', s.evidence_target, 'active', s.active) order by s.id), '[]')
               from content.skills s),
    'lessons', (select coalesce(jsonb_agg(jsonb_build_object(
                  'id', l.id, 'skillId', l.skill_id, 'title', l.title,
                  'childTitle', l.child_title, 'model', l.model, 'position', l.position,
                  'reviewStatus', l.review_status) order by l.id), '[]')
                from content.lessons l
                where not p_published_only or l.review_status = 'published'),
    'items', (select coalesce(jsonb_agg(content.cq_item_json(i) order by i.id), '[]')
              from content.items i
              where not p_published_only or i.review_status = 'published'),
    'assets', (select coalesce(jsonb_agg(jsonb_build_object(
                 'id', a.id, 'kind', a.kind, 'locale', a.locale, 'uri', a.uri,
                 'licence', a.licence, 'durationMs', a.duration_ms) order by a.id), '[]')
               from content.assets a),
    'episodes', (select coalesce(jsonb_agg(jsonb_build_object(
                   'id', e.id, 'title', e.title, 'synopsis', e.synopsis,
                   'order', to_jsonb(e.lesson_order), 'scenes', e.scenes,
                   'rewardObjectId', e.reward_object_id,
                   'reviewStatus', e.review_status) order by e.id), '[]')
                 from content.episodes e
                 where not p_published_only or e.review_status = 'published'));
$$;

-- ---------------------------------------------------------------------------
-- Serving
-- ---------------------------------------------------------------------------

/**
 * The catalogue a child is served.
 *
 * Returns the current published snapshot, or a named version for a rollback or for
 * working out what an old event was recorded against. Null when nothing is published
 * yet, which the loader reads as "fall back to the bundled bank" rather than as an
 * error: a family mid-session must not lose their quest to an empty catalogue table.
 */
create or replace function public.cq_catalogue(p_version integer default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'version', v.version, 'label', v.label, 'publishedAt', v.published_at,
    'itemCount', v.item_count, 'skillCount', v.skill_count, 'snapshot', v.snapshot)
  from content.catalogue_versions v
  where case when p_version is null then v.is_current else v.version = p_version end
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Authoring: reads
-- ---------------------------------------------------------------------------

/**
 * Everything the studio reads.
 *
 * One entry point rather than a table per endpoint, matching `public.cq_read`. Every
 * branch is gated on authorship first, so a parent who is not an author learns nothing
 * about the catalogue's shape from the error they receive.
 */
create or replace function public.cq_content_read(
  p_parent uuid, p_kind text, p_id text default null, p_filter jsonb default null,
  p_limit integer default 100, p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare lim integer := least(greatest(coalesce(p_limit, 100), 1), 500);
        off integer := greatest(coalesce(p_offset, 0), 0);
begin
  if p_parent is null or not content.cq_is_author(p_parent) then
    raise exception 'Not a catalogue author';
  end if;

  if p_kind = 'overview' then
    return jsonb_build_object(
      'current', (select jsonb_build_object('version', version, 'label', label,
                    'publishedAt', published_at, 'itemCount', item_count,
                    'skillCount', skill_count, 'warnings', jsonb_array_length(warnings))
                  from content.catalogue_versions where is_current),
      'versions', (select coalesce(jsonb_agg(jsonb_build_object('version', v.version,
                     'label', v.label, 'publishedAt', v.published_at,
                     'itemCount', v.item_count, 'isCurrent', v.is_current)
                     order by v.version desc), '[]')
                   from (select * from content.catalogue_versions
                         order by version desc limit 20) v),
      'counts', jsonb_build_object(
                    'skills', (select count(*) from content.skills),
                    'activeSkills', (select count(*) from content.skills where active),
                    'lessons', (select count(*) from content.lessons),
                    'items', (select count(*) from content.items),
                    'draft', (select count(*) from content.items where review_status = 'draft'),
                    'reviewed', (select count(*) from content.items where review_status = 'reviewed'),
                    'published', (select count(*) from content.items where review_status = 'published'),
                    'distractors', (select count(*) from content.item_distractors),
                    'unreviewedReasons', (select count(*) from content.item_distractors where not reviewed),
                    'noReason', (select count(*) from content.item_distractors where error_kind is null),
                    'assets', (select count(*) from content.assets),
                    'episodes', (select count(*) from content.episodes)),
      -- The work queue, ranked by where a wrong reason does the most damage: the
      -- misconceptions that appear most often are the ones whose teaching move is
      -- wrong most often.
      'reasonQueue', (select coalesce(jsonb_agg(jsonb_build_object(
                        'errorKind', q.error_kind, 'pending', q.pending, 'total', q.total)
                        order by q.pending desc), '[]')
                      from (select coalesce(error_kind, 'unexplained') as error_kind,
                                   count(*) filter (where not reviewed) as pending,
                                   count(*) as total
                            from content.item_distractors group by 1
                            having count(*) filter (where not reviewed) > 0) q));

  elsif p_kind = 'skills' then
    return (select coalesce(jsonb_agg(jsonb_build_object(
              'id', s.id, 'subject', s.subject, 'strand', s.strand, 'name', s.name,
              'childName', s.child_name, 'description', s.description,
              'bands', to_jsonb(s.bands), 'active', s.active,
              'prerequisites', to_jsonb(s.prerequisites), 'evidenceTarget', s.evidence_target,
              'lessonCount', (select count(*) from content.lessons l where l.skill_id = s.id),
              'itemCount', (select count(*) from content.items i where i.skill_id = s.id),
              'publishedCount', (select count(*) from content.items i
                                 where i.skill_id = s.id and i.review_status = 'published'))
              order by s.subject, s.strand, s.id), '[]')
            from content.skills s);

  elsif p_kind = 'lessons' then
    return (select coalesce(jsonb_agg(jsonb_build_object(
              'id', l.id, 'skillId', l.skill_id, 'title', l.title, 'childTitle', l.child_title,
              'model', l.model, 'position', l.position, 'reviewStatus', l.review_status,
              'itemCount', (select count(*) from content.items i where i.lesson_id = l.id))
              order by l.skill_id, l.position, l.id), '[]')
            from content.lessons l
            where p_filter->>'skillId' is null or l.skill_id = p_filter->>'skillId');

  elsif p_kind = 'items' then
    return (with picked as (
              select i.* from content.items i
              where (p_filter->>'skillId' is null or i.skill_id = p_filter->>'skillId')
                and (p_filter->>'lessonId' is null or i.lesson_id = p_filter->>'lessonId')
                and (p_filter->>'status' is null or i.review_status = p_filter->>'status')
                and (p_filter->>'subject' is null or i.delivery->>'subject' = p_filter->>'subject')
                and (p_filter->>'verb' is null or i.verb = p_filter->>'verb')
                and (p_filter->>'search' is null
                     or i.id ilike '%' || (p_filter->>'search') || '%'
                     or i.prompt->>'en' ilike '%' || (p_filter->>'search') || '%')
                and (coalesce((p_filter->>'unreviewedReasons')::boolean, false) = false
                     or exists (select 1 from content.item_distractors d
                                where d.item_id = i.id and not d.reviewed))
              order by i.id limit lim offset off)
            select coalesce(jsonb_agg(content.cq_item_row(p::content.items) order by p.id), '[]')
            from picked p);

  elsif p_kind = 'item' then
    return (select content.cq_item_row(i) from content.items i where i.id = p_id);

  -- The whole working set, in the shape `validateCatalogue` expects. Used by the
  -- publish preflight and by the studio's "what would publish do" check.
  elsif p_kind = 'draft-catalogue' then
    return content.cq_snapshot(false);

  elsif p_kind = 'snapshot' then
    return (select v.snapshot from content.catalogue_versions v
            where case when p_id is null then v.is_current else v.version = p_id::integer end);
  end if;

  raise exception 'Unknown catalogue read';
end $$;

-- ---------------------------------------------------------------------------
-- Authoring: writes
-- ---------------------------------------------------------------------------

/**
 * Everything the studio writes.
 *
 * Validating the catalogue as a whole happens in TypeScript, once, in
 * `lib/catalogue/model.ts`. Zod and a pedagogy rulebook do not belong in plpgsql, and
 * splitting them across two languages guarantees they drift. What the database enforces
 * is what only the database can: referential integrity, the closed vocabularies, the
 * immutability of published versions, and who is allowed to write at all.
 *
 * The server route runs the validator before calling `publish` and passes its warnings
 * in. `publish` still refuses to create a version with no published items, because a
 * caller that skipped validation must not be able to empty the product.
 */
create or replace function public.cq_content_write(p_parent uuid, p_kind text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  touched integer := 0; entry jsonb; document jsonb; new_version integer; published integer;
begin
  if p_parent is null or not content.cq_is_author(p_parent) then
    raise exception 'Not a catalogue author';
  end if;

  if p_kind = 'save-item' then
    entry := p_data->'item';
    if entry is null or entry->>'id' is null then raise exception 'No item supplied'; end if;
    insert into content.items (id, lesson_id, skill_id, verb, phase, bands, prompt, hint,
      explanation, answer, assets, delivery, review_status, source, updated_by)
    values (entry->>'id', entry->>'lessonId', entry->>'skillId', entry->>'verb',
      coalesce(entry->>'phase', 'independent'),
      array(select jsonb_array_elements_text(entry->'bands')),
      coalesce(entry->'prompt', '{}'::jsonb), coalesce(entry->'hint', '{}'::jsonb),
      coalesce(entry->'explanation', '{}'::jsonb), entry->>'answer',
      coalesce(entry->'assets', '[]'::jsonb), coalesce(entry->'delivery', '{}'::jsonb),
      coalesce(entry->>'reviewStatus', 'draft'), coalesce(entry->>'source', 'authored'), p_parent)
    on conflict (id) do update set
      lesson_id = excluded.lesson_id, skill_id = excluded.skill_id, verb = excluded.verb,
      phase = excluded.phase, bands = excluded.bands, prompt = excluded.prompt,
      hint = excluded.hint, explanation = excluded.explanation, answer = excluded.answer,
      assets = excluded.assets, delivery = excluded.delivery,
      review_status = excluded.review_status, updated_by = p_parent;

    -- Replace rather than merge: an author who deletes a wrong answer in the editor
    -- means it to be gone, and a merge would quietly resurrect it.
    delete from content.item_distractors where item_id = entry->>'id';
    insert into content.item_distractors (item_id, value, error_kind, reviewed, note, position)
    select entry->>'id', d.value->>'value', nullif(d.value->>'errorKind', ''),
           coalesce((d.value->>'reviewed')::boolean, false), nullif(d.value->>'note', ''), d.pos
    from jsonb_array_elements(coalesce(entry->'distractors', '[]'::jsonb))
         with ordinality as d(value, pos)
    on conflict (item_id, value) do nothing;
    return jsonb_build_object('saved', entry->>'id');

  elsif p_kind = 'save-skill' then
    entry := p_data->'skill';
    if entry is null or entry->>'id' is null then raise exception 'No skill supplied'; end if;
    insert into content.skills (id, subject, strand, name, child_name, description,
      prerequisites, bands, evidence_target, active)
    values (entry->>'id', entry->>'subject', entry->>'strand', entry->>'name',
      coalesce(entry->>'childName', entry->>'name'), coalesce(entry->>'description', ''),
      array(select jsonb_array_elements_text(entry->'prerequisites')),
      array(select jsonb_array_elements_text(entry->'bands')),
      coalesce((entry->>'evidenceTarget')::integer, 5),
      coalesce((entry->>'active')::boolean, false))
    on conflict (id) do update set
      subject = excluded.subject, strand = excluded.strand, name = excluded.name,
      child_name = excluded.child_name, description = excluded.description,
      prerequisites = excluded.prerequisites, bands = excluded.bands,
      evidence_target = excluded.evidence_target, active = excluded.active;
    return jsonb_build_object('saved', entry->>'id');

  elsif p_kind = 'save-lesson' then
    entry := p_data->'lesson';
    if entry is null or entry->>'id' is null then raise exception 'No lesson supplied'; end if;
    insert into content.lessons (id, skill_id, title, child_title, model, position, review_status)
    values (entry->>'id', entry->>'skillId', entry->>'title',
      coalesce(entry->>'childTitle', entry->>'title'), entry->'model',
      coalesce((entry->>'position')::integer, 0), coalesce(entry->>'reviewStatus', 'draft'))
    on conflict (id) do update set
      skill_id = excluded.skill_id, title = excluded.title, child_title = excluded.child_title,
      model = excluded.model, position = excluded.position, review_status = excluded.review_status;
    return jsonb_build_object('saved', entry->>'id');

  elsif p_kind = 'set-status' then
    update content.items set review_status = p_data->>'status', updated_by = p_parent
    where id in (select jsonb_array_elements_text(p_data->'ids'));
    get diagnostics touched = row_count;
    return jsonb_build_object('updated', touched);

  -- Turning a machine's guess into a person's decision. The most common single action
  -- in the studio, so it takes a batch rather than one call per row.
  elsif p_kind = 'review-reasons' then
    update content.item_distractors d set reviewed = true,
      error_kind = coalesce(r.value->>'errorKind', d.error_kind),
      note = coalesce(nullif(r.value->>'note', ''), d.note)
    from jsonb_array_elements(p_data->'reasons') as r(value)
    where d.item_id = r.value->>'itemId' and d.value = r.value->>'value';
    get diagnostics touched = row_count;
    return jsonb_build_object('updated', touched);

  -- Bulk import. Whole batch or nothing: this function runs inside the caller's
  -- transaction, so a row that violates a constraint takes the entire import with it
  -- rather than leaving an author to work out which half landed.
  elsif p_kind = 'import' then
    if jsonb_array_length(coalesce(p_data->'skills', '[]'::jsonb))
       + jsonb_array_length(coalesce(p_data->'lessons', '[]'::jsonb))
       + jsonb_array_length(coalesce(p_data->'items', '[]'::jsonb)) > 2000 then
      raise exception 'Import too large for one batch (2000 rows)';
    end if;
    for entry in select value from jsonb_array_elements(coalesce(p_data->'skills', '[]'::jsonb)) loop
      perform public.cq_content_write(p_parent, 'save-skill', jsonb_build_object('skill', entry));
      touched := touched + 1;
    end loop;
    for entry in select value from jsonb_array_elements(coalesce(p_data->'lessons', '[]'::jsonb)) loop
      perform public.cq_content_write(p_parent, 'save-lesson', jsonb_build_object('lesson', entry));
      touched := touched + 1;
    end loop;
    for entry in select value from jsonb_array_elements(coalesce(p_data->'items', '[]'::jsonb)) loop
      perform public.cq_content_write(p_parent, 'save-item', jsonb_build_object('item', entry));
      touched := touched + 1;
    end loop;
    return jsonb_build_object('imported', touched);

  elsif p_kind = 'publish' then
    document := content.cq_snapshot(true);
    published := jsonb_array_length(document->'items');
    if published = 0 then
      raise exception 'Nothing is marked published, so this would empty the catalogue';
    end if;
    -- Claim the version number before writing, so the document carries the same number
    -- the row does and the snapshot never has to be updated after insert.
    new_version := nextval(pg_get_serial_sequence('content.catalogue_versions', 'version'));
    document := jsonb_set(document, '{version}', to_jsonb(new_version));
    document := jsonb_set(document, '{label}',
      to_jsonb(coalesce(nullif(p_data->>'label', ''), to_char(now(), 'YYYY-MM-DD HH24:MI'))));
    update content.catalogue_versions set is_current = false where is_current;
    insert into content.catalogue_versions (version, label, snapshot, item_count, skill_count,
      lesson_count, warnings, notes, is_current, published_by)
    overriding system value
    values (new_version, document->>'label', document, published,
      jsonb_array_length(document->'skills'), jsonb_array_length(document->'lessons'),
      coalesce(p_data->'warnings', '[]'::jsonb), nullif(p_data->>'notes', ''), true, p_parent);
    return jsonb_build_object('version', new_version, 'itemCount', published,
      'skillCount', jsonb_array_length(document->'skills'));

  -- Rollback. The snapshot this points back to was never mutated, so it really is a
  -- return to what children were being served, not an approximation of it.
  elsif p_kind = 'rollback' then
    new_version := (p_data->>'version')::integer;
    if not exists (select 1 from content.catalogue_versions where version = new_version) then
      raise exception 'No such catalogue version';
    end if;
    update content.catalogue_versions set is_current = false where is_current;
    update content.catalogue_versions set is_current = true where version = new_version;
    return jsonb_build_object('version', new_version);
  end if;

  raise exception 'Unknown catalogue write';
end $$;

-- Same posture as every other privileged routine here: unreachable from the Data API
-- even with a valid parent JWT, callable only by the server holding the secret key.
revoke all on function public.cq_catalogue(integer) from public, anon, authenticated;
revoke all on function public.cq_content_read(uuid,text,text,jsonb,integer,integer) from public, anon, authenticated;
revoke all on function public.cq_content_write(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.cq_catalogue(integer) to service_role;
grant execute on function public.cq_content_read(uuid,text,text,jsonb,integer,integer) to service_role;
grant execute on function public.cq_content_write(uuid,text,jsonb) to service_role;

update private.backend_metadata set version = '202609200004';
commit;
