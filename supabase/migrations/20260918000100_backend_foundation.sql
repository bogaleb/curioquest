-- Phase 1 foundation. Family data is read-only to application roles until
-- guarded, transactional write operations are introduced in later migrations.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.backend_metadata (
  singleton boolean primary key default true check (singleton),
  version text not null
);
insert into private.backend_metadata values (true, '202609180001');

create function public.backend_version() returns text
language sql stable security definer set search_path = ''
as $$ select version from private.backend_metadata where singleton = true $$;
revoke all on function public.backend_version() from public;
grant execute on function public.backend_version() to anon, authenticated;
comment on function public.backend_version() is 'Non-sensitive database connectivity and schema version probe.';

create table public.parents (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 24),
  grade text not null check (grade in ('prek', 'grade1')),
  avatar text not null check (avatar in ('fox','rabbit','bear','owl','panda','lion')),
  interests text[] not null default '{}',
  daily_goal integer not null default 10 check (daily_goal in (8,10,15,20)),
  controls jsonb not null default '{}' check (jsonb_typeof(controls) = 'object'),
  preferences jsonb not null default '{}' check (jsonb_typeof(preferences) = 'object'),
  legacy_id text,
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, legacy_id),
  unique (id, parent_id)
);
create index child_profiles_parent on public.child_profiles(parent_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  position integer not null default 0,
  published boolean not null default false
);
create table public.units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  slug text not null,
  title text not null,
  grade text not null check (grade in ('prek','grade1')),
  position integer not null default 0,
  published boolean not null default false,
  unique (subject_id, slug, grade)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  slug text not null,
  version integer not null default 1 check (version > 0),
  title text not null,
  position integer not null default 0,
  published boolean not null default false,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  unique (unit_id, slug, version)
);
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  slug text not null,
  version integer not null default 1 check (version > 0),
  engine_kind text not null,
  config jsonb not null default '{}' check (jsonb_typeof(config) = 'object'),
  position integer not null default 0,
  published boolean not null default false,
  unique (lesson_id, slug, version)
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete restrict,
  slug text not null,
  prompt text not null,
  options jsonb not null default '[]' check (jsonb_typeof(options) = 'array'),
  hint text not null default '',
  position integer not null default 0,
  unique (activity_id, slug),
  unique (id, activity_id)
);
-- Answers are never exposed through the Data API, even for published content.
create table private.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.questions(id) on delete cascade,
  answer jsonb not null,
  explanation text not null default ''
);

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  kind text not null,
  status text not null default 'active' check (status in ('active','suspended','completed','abandoned')),
  state jsonb not null default '{}' check (jsonb_typeof(state) = 'object'),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  revision bigint not null default 0 check (revision >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  suspended_at timestamptz,
  unique (id, child_id)
);
create index learning_sessions_child_date on public.learning_sessions(child_id, started_at desc);
create table public.activity_attempts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  session_id uuid not null,
  activity_id uuid not null references public.activities(id) on delete restrict,
  question_id uuid,
  mutation_id uuid not null,
  response jsonb not null,
  correct boolean not null,
  help_level integer not null default 0 check (help_level >= 0),
  attempt_number integer not null check (attempt_number > 0),
  response_time_ms integer check (response_time_ms >= 0),
  evidence jsonb not null default '{}' check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (session_id, child_id) references public.learning_sessions(id, child_id) on delete cascade,
  foreign key (question_id, activity_id) references public.questions(id, activity_id) on delete restrict,
  unique (child_id, mutation_id)
);
create index activity_attempts_child_date on public.activity_attempts(child_id, created_at desc);
create index activity_attempts_session_child on public.activity_attempts(session_id, child_id);
create index activity_attempts_activity on public.activity_attempts(activity_id);
create index activity_attempts_question_activity on public.activity_attempts(question_id, activity_id);

create table public.child_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  skill_slug text not null,
  domain text not null,
  evidence jsonb not null default '{}' check (jsonb_typeof(evidence) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  last_practiced_at timestamptz,
  review_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (child_id, skill_slug, domain)
);
comment on column public.child_progress.skill_slug is 'Stable current engine ID; normalize to the skills catalog in the curriculum migration.';

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  published boolean not null default false
);
create table public.child_achievements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete restrict,
  earned_at timestamptz not null default now(),
  source_session_id uuid,
  foreign key (source_session_id, child_id) references public.learning_sessions(id, child_id) on delete restrict,
  unique (child_id, achievement_id)
);
create index child_achievements_achievement on public.child_achievements(achievement_id);
create index child_achievements_session on public.child_achievements(source_session_id, child_id);
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind text not null,
  presentation jsonb not null default '{}' check (jsonb_typeof(presentation) = 'object'),
  published boolean not null default false
);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  slug text not null,
  title text not null,
  media_type text not null,
  bucket text,
  object_path text,
  bundled_path text,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check ((bucket is null) = (object_path is null)),
  check (not (bucket is not null and bundled_path is not null)),
  check (parent_id is null or not published)
);
create index media_assets_parent on public.media_assets(parent_id);

-- Supabase default grants must not allow direct client writes to derived data.
do $$
declare table_name text;
begin
  foreach table_name in array array['parents','child_profiles','subjects','units','lessons',
    'activities','questions','learning_sessions','activity_attempts','child_progress',
    'achievements','child_achievements','rewards','media_assets']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
  end loop;
end $$;
revoke all on all tables in schema private from public, anon, authenticated;

create policy parents_read_own on public.parents for select to authenticated
using (id = (select auth.uid()));
create policy children_read_own on public.child_profiles for select to authenticated
using (parent_id = (select auth.uid()));

do $$
declare table_name text;
begin
  foreach table_name in array array['learning_sessions','activity_attempts','child_progress','child_achievements']
  loop
    execute format('create policy family_read on public.%I for select to authenticated using
      (exists (select 1 from public.child_profiles c where c.id = child_id and c.parent_id = (select auth.uid())))', table_name);
  end loop;
end $$;

create policy published_subjects on public.subjects for select to authenticated using (published);
create policy published_units on public.units for select to authenticated
using (published and exists (select 1 from public.subjects s where s.id = subject_id));
create policy published_lessons on public.lessons for select to authenticated
using (published and exists (select 1 from public.units u where u.id = unit_id));
create policy published_activities on public.activities for select to authenticated
using (published and exists (select 1 from public.lessons l where l.id = lesson_id));
create policy published_questions on public.questions for select to authenticated
using (exists (select 1 from public.activities a where a.id = activity_id));
create policy published_achievements on public.achievements for select to authenticated using (published);
create policy published_rewards on public.rewards for select to authenticated using (published);
create policy media_read on public.media_assets for select to authenticated
using ((parent_id is null and published) or parent_id = (select auth.uid()));

commit;
