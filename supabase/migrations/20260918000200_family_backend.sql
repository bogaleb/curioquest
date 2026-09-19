-- Phases 2–7: tenant ownership, compatibility state, transactional learning writes.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table private.explorer_state (
 child_id uuid primary key references public.child_profiles(id) on delete cascade,
 data jsonb not null, revision bigint not null default 0
);
create table private.reading_state (
 child_id uuid primary key references public.child_profiles(id) on delete cascade,
 data jsonb not null, revision bigint not null default 0
);
create table private.experience_state (
 child_id uuid primary key references public.child_profiles(id) on delete cascade,
 data jsonb not null, revision bigint not null default 0
);
create table private.catalogs (name text primary key, data jsonb not null, version integer not null default 1);
create table private.workspace_items (
 id uuid primary key default gen_random_uuid(), parent_id uuid not null references public.parents(id) on delete cascade,
 child_id uuid, kind text not null, data jsonb not null, revision bigint not null default 0,
 updated_at timestamptz not null default now(), story_slug text,
 foreign key(child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade,
 unique(child_id,story_slug)
);
create index workspace_owner_kind on private.workspace_items(parent_id,child_id,kind,updated_at desc);
create table private.raw_attempts (
 id uuid primary key, child_id uuid not null references public.child_profiles(id) on delete cascade,
 domain text not null, data jsonb not null, created_at timestamptz not null default now()
);
create index raw_attempts_child_date on private.raw_attempts(child_id,created_at);
create table private.parent_gates (
 parent_id uuid primary key references public.parents(id) on delete cascade,
 pin_hash text not null, recovery_hash text not null, attempts integer not null default 0,
 window_until timestamptz not null default now()
);
create table private.gate_sessions (
 id uuid primary key default gen_random_uuid(), parent_id uuid not null references public.parents(id) on delete cascade,
 token_hash text not null unique, expires_at timestamptz not null
);
create index gate_sessions_parent on private.gate_sessions(parent_id);
create table public.reward_events (
 id uuid primary key default gen_random_uuid(), child_id uuid not null references public.child_profiles(id) on delete cascade,
 amount integer not null, source text not null, created_at timestamptz not null default now(), unique(child_id,source)
);
create table public.child_rewards (
 id uuid primary key default gen_random_uuid(), child_id uuid not null references public.child_profiles(id) on delete cascade,
 reward_id uuid not null references public.rewards(id), earned_at timestamptz not null default now(), unique(child_id,reward_id)
);
create index child_rewards_reward on public.child_rewards(reward_id);
create table public.world_item_placements (
 id uuid primary key default gen_random_uuid(), child_id uuid not null references public.child_profiles(id) on delete cascade,
 slot text not null check(slot in ('wall','shelf','desk')), reward_id uuid not null references public.rewards(id),
 foreign key(child_id,reward_id) references public.child_rewards(child_id,reward_id) on delete cascade,
 unique(child_id,slot), unique(child_id,reward_id)
);
create index world_placements_reward on public.world_item_placements(reward_id);

create function private.cq_new_parent() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.parents(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),80)) on conflict do nothing;
 return new;
end $$;
create trigger cq_new_parent after insert on auth.users for each row execute function private.cq_new_parent();
insert into public.parents(id) select id from auth.users on conflict do nothing;

create function private.cq_item(item private.workspace_items) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',item.id,'profileId',coalesce(item.child_id::text,'family'),'kind',item.kind,'data',item.data,'revision',item.revision,'updatedAt',item.updated_at)
$$;

-- Compatibility JSON is authoritative during normalization. Its public projections are
-- updated in the same transaction, never in a second request.
create function private.cq_apply_child(p_child uuid,p_data jsonb) returns void language plpgsql set search_path='' as $$
declare old_data jsonb; rev bigint; delta integer; s jsonb; entry record; completed integer;
begin
 select data,revision into old_data,rev from private.explorer_state where child_id=p_child for update;
 delta := coalesce((p_data->>'stars')::integer,0)-coalesce((old_data->>'stars')::integer,0);
 if coalesce((p_data->>'stars')::integer,0)<0 then raise exception 'Invalid balance'; end if;
 update private.explorer_state set data=p_data,revision=revision+1 where child_id=p_child;
 update public.child_profiles set name=p_data->>'name',grade=p_data->>'grade',avatar=p_data->>'avatar',
 interests=array(select jsonb_array_elements_text(p_data->'interests')), daily_goal=(p_data->>'dailyGoal')::integer,
 controls=p_data->'controls',preferences=p_data->'preferences',revision=rev+1,updated_at=now() where id=p_child;
 if delta<>0 then insert into public.reward_events(child_id,amount,source) values(p_child,delta,'profile:'||(rev+1)::text); end if;
 delete from public.child_progress where child_id=p_child and domain='classic';
 for entry in select * from jsonb_each(coalesce(p_data->'skillMastery','{}')) loop
  insert into public.child_progress(child_id,skill_slug,domain,evidence,last_practiced_at,review_at)
  values(p_child,entry.key,'classic',entry.value,(entry.value->>'lastPracticedAt')::timestamptz,(entry.value->>'nextReviewAt')::timestamptz);
 end loop;
 for s in select value from jsonb_array_elements(coalesce(p_data->'savedSessions','[]') ||
  case when jsonb_typeof(p_data->'session')='object' then jsonb_build_array(p_data->'session') else '[]'::jsonb end) loop
  insert into public.learning_sessions(id,child_id,kind,status,state,revision,started_at,completed_at)
  values((s->>'id')::uuid,p_child,'classic',case when (s->>'index')::int>=jsonb_array_length(s->'questions') then 'completed'
    when s->>'suspendedAt' is not null then 'suspended' else 'active' end,
    jsonb_build_object('index',s->'index','questions',s->'questions','subject',s->'subject'),rev+1,
    to_timestamp((s->>'started')::double precision/1000),
    case when (s->>'index')::int>=jsonb_array_length(s->'questions') then now() end)
  on conflict(id) do update set state=excluded.state,status=excluded.status,revision=excluded.revision,completed_at=coalesce(learning_sessions.completed_at,excluded.completed_at)
  where learning_sessions.child_id=p_child;
 end loop;
 completed:=coalesce((p_data->>'completed')::int,0);
 insert into public.child_achievements(child_id,achievement_id)
 select p_child,id from public.achievements where slug in ('get-curious','keep-exploring','think-bigger','shine-bright')
 and completed>=case slug when 'get-curious' then 0 when 'keep-exploring' then 3 when 'think-bigger' then 6 else 9 end
 on conflict(child_id,achievement_id) do nothing;
end $$;

create function private.cq_reading_progress(p_child uuid,p_data jsonb) returns void language plpgsql set search_path='' as $$
declare entry record; s jsonb;
begin
 delete from public.child_progress where child_id=p_child and domain='reading';
 for entry in select * from jsonb_each(coalesce(p_data->'mastery','{}')) loop
  insert into public.child_progress(child_id,skill_slug,domain,evidence,last_practiced_at,review_at)
  values(p_child,entry.key,'reading',entry.value,(entry.value->>'lastPracticed')::timestamptz,(entry.value->>'reviewAt')::timestamptz);
 end loop;
 s:=p_data->'session';
 if jsonb_typeof(s)='object' then
  insert into public.learning_sessions(id,child_id,kind,status,state,started_at,completed_at)
  values((s->>'id')::uuid,p_child,'reading',case when s->>'completedAt' is null then 'active' else 'completed' end,
   jsonb_build_object('index',s->'index','total',jsonb_array_length(s->'activities')), (s->>'startedAt')::timestamptz,(s->>'completedAt')::timestamptz)
  on conflict(id) do update set state=excluded.state,status=excluded.status,completed_at=excluded.completed_at,revision=learning_sessions.revision+1
  where learning_sessions.child_id=p_child;
 end if;
end $$;

create function private.cq_record_attempt(p_child uuid,a jsonb,p_domain text) returns void language plpgsql set search_path='' as $$
declare activity uuid; question uuid; lesson uuid; sid uuid;
begin
 if a is null or a='null'::jsonb then return; end if;
 sid:=(a->>'sessionId')::uuid;
 insert into public.learning_sessions(id,child_id,kind) values(sid,p_child,p_domain) on conflict(id) do nothing;
 if not exists(select 1 from public.learning_sessions where id=sid and child_id=p_child) then raise exception 'Session owner mismatch'; end if;
 if a->>'questionSlug' is not null then
  select q.id,q.activity_id into question,activity from public.questions q where q.slug=a->>'questionSlug' order by q.id limit 1;
 else
  select id into lesson from public.lessons where slug='runtime-'||p_domain limit 1;
  activity:=md5(p_child::text||sid::text||(a->>'activityId'))::uuid;
  insert into public.activities(id,lesson_id,slug,engine_kind,published)
  values(activity,lesson,sid::text||':'||(a->>'activityId'),coalesce(a->>'kind',p_domain),false) on conflict(id) do nothing;
 end if;
 if activity is null then raise exception 'Activity catalog is missing'; end if;
 insert into public.activity_attempts(id,child_id,session_id,activity_id,question_id,mutation_id,response,correct,help_level,attempt_number,response_time_ms,evidence,created_at)
 values((a->>'id')::uuid,p_child,sid,activity,question,(a->>'id')::uuid,coalesce(a->'response','null'),
 (a->>'correct')::boolean,coalesce((a->>'helpLevel')::int,0),(a->>'attemptNumber')::int,
 (a->>'responseTimeMs')::int,jsonb_build_object('kind',a->'evidence','skillId',a->'skillId','errorType',a->'errorType'),(a->>'createdAt')::timestamptz);
 insert into private.raw_attempts(id,child_id,domain,data) values((a->>'id')::uuid,p_child,p_domain,a);
end $$;

create function public.cq_read(p_parent uuid,p_kind text,p_child uuid default null,p_id uuid default null,p_filter text default null,p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if p_parent is null then raise exception 'Parent required'; end if;
 if p_child is not null and not exists(select 1 from public.child_profiles where id=p_child and parent_id=p_parent) then return null; end if;
 if p_kind='catalog' then
  select data into result from private.catalogs where name=p_filter;
  if result is null then raise exception 'Catalog migration missing'; end if; return result;
 elsif p_kind='explorers' then
  return (select coalesce(jsonb_agg(jsonb_build_object('data',e.data::text,'revision',e.revision) order by c.created_at,c.id),'[]')
   from private.explorer_state e join public.child_profiles c on c.id=e.child_id where c.parent_id=p_parent);
 elsif p_kind='explorer' then
  return (select jsonb_build_object('data',e.data::text,'revision',e.revision) from private.explorer_state e
   join public.child_profiles c on c.id=e.child_id where c.parent_id=p_parent and c.id=p_child);
 elsif p_kind='reading' then
  return (select jsonb_build_object('data',data,'revision',revision) from private.reading_state where child_id=p_child);
 elsif p_kind='experience' then
  return (select jsonb_build_object('data',data,'revision',revision) from private.experience_state where child_id=p_child);
 elsif p_kind='inventory' then
  return jsonb_build_object('inventory',(select coalesce(jsonb_agg(jsonb_build_object('item_id',r.slug,'earned_at',i.earned_at)),'[]')
   from public.child_rewards i join public.rewards r on r.id=i.reward_id where i.child_id=p_child),
   'placements',(select coalesce(jsonb_agg(jsonb_build_object('slot',i.slot,'item_id',r.slug)),'[]')
   from public.world_item_placements i join public.rewards r on r.id=i.reward_id where i.child_id=p_child));
 elsif p_kind='items' then
  return (select coalesce(jsonb_agg(private.cq_item(w)),'[]') from
   (select * from private.workspace_items where parent_id=p_parent and child_id is not distinct from p_child and kind=p_filter
    order by updated_at desc,id limit least(greatest(p_limit,1),100) offset greatest(p_offset,0)) w);
 elsif p_kind='item' then return (select private.cq_item(w) from private.workspace_items w where id=p_id and parent_id=p_parent);
 elsif p_kind='media' then return (select coalesce(jsonb_agg(to_jsonb(m) order by m.parent_id nulls last,m.created_at desc),'[]') from public.media_assets m where parent_id=p_parent or (parent_id is null and published));
 elsif p_kind='export' then
  return jsonb_build_object(
   'profiles',(select coalesce(jsonb_agg(e.data),'[]') from private.explorer_state e join public.child_profiles c on c.id=e.child_id where c.parent_id=p_parent),
   'collections',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'profile_id',coalesce(child_id::text,'family'),'kind',kind,'data',data,'revision',revision,'updated_at',updated_at)),'[]') from private.workspace_items where parent_id=p_parent),
   'reading',jsonb_build_object(
    'profiles',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from private.reading_state r join public.child_profiles c on c.id=r.child_id where c.parent_id=p_parent),
    'attempts',(select coalesce(jsonb_agg(a.data order by a.created_at),'[]') from private.raw_attempts a join public.child_profiles c on c.id=a.child_id where c.parent_id=p_parent and a.domain in ('reading','experience'))),
   'experience',jsonb_build_object(
    'profiles',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from private.experience_state e join public.child_profiles c on c.id=e.child_id where c.parent_id=p_parent),
    'responses',(select coalesce(jsonb_agg(a.data order by a.created_at),'[]') from private.raw_attempts a join public.child_profiles c on c.id=a.child_id where c.parent_id=p_parent and a.domain='experience'),
    'inventory',(select coalesce(jsonb_agg(jsonb_build_object('child_id',i.child_id,'item_id',r.slug,'earned_at',i.earned_at)),'[]') from public.child_rewards i join public.rewards r on r.id=i.reward_id join public.child_profiles c on c.id=i.child_id where c.parent_id=p_parent),
    'placements',(select coalesce(jsonb_agg(jsonb_build_object('child_id',i.child_id,'slot',i.slot,'item_id',r.slug)),'[]') from public.world_item_placements i join public.rewards r on r.id=i.reward_id join public.child_profiles c on c.id=i.child_id where c.parent_id=p_parent)),
   'attempts',(select coalesce(jsonb_agg(a.data order by a.created_at),'[]') from private.raw_attempts a join public.child_profiles c on c.id=a.child_id where c.parent_id=p_parent and a.domain='classic'),
   'rewardEvents',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from public.reward_events e join public.child_profiles c on c.id=e.child_id where c.parent_id=p_parent)
  );
 end if;
 raise exception 'Unknown read operation';
end $$;

create function public.cq_commit(p_parent uuid,p_kind text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare child uuid; profile jsonb; entry jsonb; current_data jsonb; rev bigint; rr bigint; result jsonb;
 item private.workspace_items; gate private.parent_gates; secret text; recovery text; action text; unlocked boolean;
 stars integer:=0; reward uuid; source text; s jsonb;
begin
 if p_parent is null or not exists(select 1 from auth.users where id=p_parent) then raise exception 'Parent required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_parent::text,0));
 insert into public.parents(id) values(p_parent) on conflict do nothing;
 child:=coalesce(p_data->>'childId',p_data->>'id')::uuid;
 if child is not null and p_kind not in ('update-item','delete-item') and not exists(select 1 from public.child_profiles where id=child and parent_id=p_parent) then return 'false'; end if;
 if p_kind='gate' then
  action:=p_data->>'action';
  select * into gate from private.parent_gates where parent_id=p_parent;
  unlocked:=exists(select 1 from private.gate_sessions where parent_id=p_parent and token_hash=encode(extensions.digest(coalesce(p_data->>'token',''),'sha256'),'hex') and expires_at>now());
  if action='status' then return jsonb_build_object('configured',gate.parent_id is not null,'unlocked',unlocked); end if;
  if action='lock' then delete from private.gate_sessions where parent_id=p_parent; return jsonb_build_object('configured',gate.parent_id is not null,'unlocked',false); end if;
  if coalesce(p_data->>'pin','') !~ '^[0-9]{6}$' then return jsonb_build_object('status',400,'error','Use a six-digit PIN.'); end if;
  if action='setup' and gate.parent_id is not null then return jsonb_build_object('status',409,'error','A parent PIN is already configured.'); end if;
  if action<>'setup' and gate.parent_id is null then return jsonb_build_object('status',409,'error','Set up a parent PIN first.'); end if;
  if gate.parent_id is not null then
   if gate.window_until>now() and gate.attempts>=5 then return jsonb_build_object('status',429,'error','Too many tries. Please wait 15 minutes.'); end if;
   update private.parent_gates set attempts=case when window_until<=now() then 1 else attempts+1 end,
    window_until=case when window_until<=now() then now()+interval '15 minutes' else window_until end where parent_id=p_parent;
   if (action='recover' and gate.recovery_hash<>encode(extensions.digest(coalesce(p_data->>'recoveryCode',''),'sha256'),'hex'))
    or (action='unlock' and gate.pin_hash<>extensions.crypt(p_data->>'pin',gate.pin_hash)) then
    return jsonb_build_object('status',403,'error','That PIN or recovery code did not match.');
   end if;
  end if;
  if action in ('setup','recover') then
   recovery:=encode(extensions.gen_random_bytes(32),'hex');
   insert into private.parent_gates(parent_id,pin_hash,recovery_hash) values(p_parent,extensions.crypt(p_data->>'pin',extensions.gen_salt('bf',10)),encode(extensions.digest(recovery,'sha256'),'hex'))
    on conflict(parent_id) do update set pin_hash=excluded.pin_hash,recovery_hash=excluded.recovery_hash;
  elsif action<>'unlock' then raise exception 'Unknown gate action'; end if;
  update private.parent_gates set attempts=0,window_until=now() where parent_id=p_parent;
  delete from private.gate_sessions where parent_id=p_parent or expires_at<=now();
  secret:=encode(extensions.gen_random_bytes(32),'hex');
  insert into private.gate_sessions(parent_id,token_hash,expires_at) values(p_parent,encode(extensions.digest(secret,'sha256'),'hex'),now()+interval '15 minutes');
  return jsonb_strip_nulls(jsonb_build_object('configured',true,'unlocked',true,'cookieToken',secret,'recoveryCode',recovery));
 elsif p_kind='create-explorer' then
  profile:=p_data->'profile';child:=(profile->>'id')::uuid;
  if (select count(*) from public.child_profiles where parent_id=p_parent)>=4 then return 'false'; end if;
  insert into public.child_profiles(id,parent_id,name,grade,avatar,daily_goal,controls,preferences)
   values(child,p_parent,profile->>'name',profile->>'grade',profile->>'avatar',(profile->>'dailyGoal')::int,profile->'controls',profile->'preferences');
  insert into private.explorer_state(child_id,data) values(child,profile);
  perform private.cq_apply_child(child,profile);
  return 'true';
 elsif p_kind='delete-explorer' then
  if (select count(*) from public.child_profiles where parent_id=p_parent)<=1 then return 'false'; end if;
  if not exists(select 1 from private.explorer_state where child_id=child and revision=(p_data->>'revision')::bigint) then return 'false'; end if;
  delete from public.child_profiles where id=child and parent_id=p_parent;return 'true';
 elsif p_kind='save-explorers' then
  for entry in select value from jsonb_array_elements(p_data->'profiles') loop
   child:=(entry->'profile'->>'id')::uuid;
   if not exists(select 1 from private.explorer_state e join public.child_profiles c on c.id=e.child_id
    where c.parent_id=p_parent and c.id=child and e.revision=(entry->>'revision')::bigint) then return 'false'; end if;
  end loop;
  for entry in select value from jsonb_array_elements(p_data->'profiles') loop
   child:=(entry->'profile'->>'id')::uuid;
   perform private.cq_apply_child(child,entry->'profile');
   if coalesce((p_data->>'reset')::boolean,false) then
    delete from private.reading_state where child_id=child;delete from private.experience_state where child_id=child;
    delete from public.child_progress where child_id=child and domain='reading';
    delete from private.raw_attempts where child_id=child;
    delete from public.learning_sessions where child_id=child;
    delete from public.child_achievements where child_id=child and achievement_id in(select id from public.achievements where slug<>'get-curious');
   end if;
  end loop;
  perform private.cq_record_attempt(child,p_data->'attempt','classic');return 'true';
 elsif p_kind in ('save-reading','save-experience') then
  select data into current_data from private.explorer_state where child_id=child;
  if current_data is null then return 'false'; end if;
  select revision into rr from private.reading_state where child_id=child;rr:=coalesce(rr,0);
  if p_kind='save-reading' then
   if rr<>(p_data->>'revision')::bigint then return 'false'; end if;
   profile:=p_data->'profile';
   insert into private.reading_state(child_id,data,revision) values(child,profile,rr+1)
    on conflict(child_id) do update set data=excluded.data,revision=excluded.revision;
   perform private.cq_reading_progress(child,profile);
   stars:=coalesce((p_data->>'stars')::int,0);
   perform private.cq_record_attempt(child,p_data->'attempt','reading');
  else
   select revision into rev from private.experience_state where child_id=child;rev:=coalesce(rev,0);
   if rev<>(p_data->>'revision')::bigint or rr<>(p_data->>'readingRevision')::bigint then return 'false'; end if;
   profile:=p_data->'state';
   insert into private.experience_state(child_id,data,revision) values(child,profile,rev+1)
    on conflict(child_id) do update set data=excluded.data,revision=excluded.revision;
   for entry in select value from jsonb_each(profile->'runs') loop
    insert into public.learning_sessions(id,child_id,kind,status,state,started_at,completed_at)
    values((entry->>'id')::uuid,child,'experience',case when entry->>'completedAt' is null then 'active' else 'completed' end,
     jsonb_build_object('index',entry->'index','mode',entry->'mode'),(entry->>'startedAt')::timestamptz,(entry->>'completedAt')::timestamptz)
    on conflict(id) do update set status=excluded.status,state=excluded.state,completed_at=excluded.completed_at,revision=learning_sessions.revision+1
    where learning_sessions.child_id=child;
   end loop;
   if jsonb_typeof(p_data->'attempt')='object' then
    insert into private.reading_state(child_id,data,revision) values(child,p_data->'reading',rr+1)
     on conflict(child_id) do update set data=excluded.data,revision=excluded.revision;
    perform private.cq_reading_progress(child,p_data->'reading');
    perform private.cq_record_attempt(child,p_data->'attempt','experience');
   end if;
   for source in select jsonb_array_elements_text(p_data->'rewards') loop
    select id into reward from public.rewards where slug=source;
    if reward is null then raise exception 'Unknown reward'; end if;
    insert into public.child_rewards(child_id,reward_id) values(child,reward) on conflict do nothing;
    if found then stars:=stars+2; end if;
   end loop;
   if jsonb_typeof(p_data->'placement')='object' then
    select id into reward from public.rewards where slug=p_data->'placement'->>'item';
    if p_data->'placement'->>'item' is not null and (reward is null or not exists(select 1 from public.child_rewards where child_id=child and reward_id=reward)) then raise exception 'Reward is not owned'; end if;
    delete from public.world_item_placements where child_id=child and (slot=p_data->'placement'->>'slot' or reward_id=reward);
    if reward is not null then insert into public.world_item_placements(child_id,slot,reward_id) values(child,p_data->'placement'->>'slot',reward); end if;
   end if;
  end if;
  if stars<>0 then perform private.cq_apply_child(child,jsonb_set(current_data,'{stars}',to_jsonb(coalesce((current_data->>'stars')::int,0)+stars))); end if;
  return 'true';
 elsif p_kind='create-item' then
  if (select count(*) from private.workspace_items where parent_id=p_parent and child_id is not distinct from child and kind=p_data->>'kind')>=100 then return null; end if;
  insert into private.workspace_items(parent_id,child_id,kind,data) values(p_parent,child,p_data->>'kind',p_data->'data') returning * into item;
  return private.cq_item(item);
 elsif p_kind='update-item' then
  update private.workspace_items set data=p_data->'data',revision=revision+1,updated_at=now()
   where id=(p_data->>'id')::uuid and parent_id=p_parent and revision=(p_data->>'revision')::bigint returning * into item;
  return case when found then private.cq_item(item) else null end;
 elsif p_kind='delete-item' then
  delete from private.workspace_items where id=(p_data->>'id')::uuid and parent_id=p_parent and revision=(p_data->>'revision')::bigint;return to_jsonb(found);
 elsif p_kind='save-story' then
  insert into private.workspace_items(parent_id,child_id,kind,data,story_slug) values(p_parent,child,'story',p_data->'data',p_data->>'storyId')
   on conflict(child_id,story_slug) do update set data=excluded.data,revision=workspace_items.revision+1,updated_at=now();return 'true';
 end if;
 raise exception 'Unknown write operation';
end $$;

-- Neither anon nor authenticated can invoke privileged state transitions, even
-- by calling the Data API directly with a valid parent JWT.
revoke all on function public.cq_read(uuid,text,uuid,uuid,text,integer,integer) from public,anon,authenticated;
revoke all on function public.cq_commit(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.cq_read(uuid,text,uuid,uuid,text,integer,integer) to service_role;
grant execute on function public.cq_commit(uuid,text,jsonb) to service_role;
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on all tables in schema private from public,anon,authenticated;
do $$
declare t text;
begin
 foreach t in array array['explorer_state','reading_state','experience_state','catalogs','workspace_items','raw_attempts','parent_gates','gate_sessions'] loop
  execute format('alter table private.%I enable row level security',t);
 end loop;
 foreach t in array array['reward_events','child_rewards','world_item_placements'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy family_read on public.%I for select to authenticated using (exists(select 1 from public.child_profiles c where c.id=child_id and c.parent_id=(select auth.uid())))',t);
 end loop;
end $$;
update private.backend_metadata set version='202609180004';
commit;

