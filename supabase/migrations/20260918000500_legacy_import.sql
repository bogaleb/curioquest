-- Explicit, repeat-safe import into an EMPTY verified parent account.
begin;
create table private.import_receipts(
 id uuid primary key default gen_random_uuid(),parent_id uuid not null references public.parents(id) on delete cascade,
 source_hash text not null, child_map jsonb not null, imported_at timestamptz not null default now(),unique(parent_id,source_hash)
);
alter table private.import_receipts enable row level security;
revoke all on private.import_receipts from public,anon,authenticated;
create function public.cq_import(p_parent uuid,p_bundle jsonb,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare row jsonb; child uuid; reward uuid; kind text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_parent::text,0));
 if exists(select 1 from private.import_receipts where parent_id=p_parent and source_hash=p_hash) then return jsonb_build_object('alreadyImported',true); end if;
 if exists(select 1 from public.child_profiles where parent_id=p_parent) then raise exception 'Import requires an empty family'; end if;
 if jsonb_array_length(p_bundle->'profiles') not between 1 and 4 then raise exception 'Import needs one to four children'; end if;
 for row in select value from jsonb_array_elements(p_bundle->'profiles') loop
  perform public.cq_commit(p_parent,'create-explorer',jsonb_build_object('profile',row));
  child:=(row->>'id')::uuid;
  if coalesce((row->>'stars')::int,0)>0 then
   insert into public.reward_events(child_id,amount,source) values(child,(row->>'stars')::int,'legacy-import:'||p_hash);
  end if;
 end loop;
 for row in select value from jsonb_array_elements(coalesce(p_bundle->'collections','[]')) loop
  child:=case when row->>'profile_id'='family' then null else (row->>'profile_id')::uuid end;
  insert into private.workspace_items(id,parent_id,child_id,kind,data,revision,updated_at,story_slug)
   values((row->>'id')::uuid,p_parent,child,row->>'kind',row->'data',coalesce((row->>'revision')::bigint,0),
    coalesce((row->>'updated_at')::timestamptz,now()),case when row->>'kind'='story' then row->'data'->>'storyId' end);
 end loop;
 for row in select value from jsonb_array_elements(coalesce(p_bundle->'reading'->'profiles','[]')) loop
  child:=(row->>'child_id')::uuid;
  if not exists(select 1 from public.child_profiles where id=child and parent_id=p_parent) then raise exception 'Imported child mismatch'; end if;
  insert into private.reading_state(child_id,data) values(child,row->'data');
  perform private.cq_reading_progress(child,row->'data');
 end loop;
 for row in select value from jsonb_array_elements(coalesce(p_bundle->'experience'->'profiles','[]')) loop
  child:=(row->>'child_id')::uuid;
  if not exists(select 1 from public.child_profiles where id=child and parent_id=p_parent) then raise exception 'Imported child mismatch'; end if;
  insert into private.experience_state(child_id,data) values(child,row->'data');
 end loop;
 for row in select value from jsonb_array_elements(coalesce(p_bundle->'reading'->'attempts','[]')) loop
  child:=(row->>'childId')::uuid;
  if not exists(select 1 from public.child_profiles where id=child and parent_id=p_parent) then raise exception 'Imported child mismatch'; end if;
  kind:=case when exists(select 1 from jsonb_array_elements(coalesce(p_bundle->'experience'->'responses','[]')) e where e->>'id'=row->>'id') then 'experience' else 'reading' end;
  perform private.cq_record_attempt(child,row,kind);
 end loop;
 for row in select value from jsonb_array_elements(coalesce(p_bundle->'experience'->'inventory','[]')) loop
  child:=(row->>'child_id')::uuid;
  if not exists(select 1 from public.child_profiles where id=child and parent_id=p_parent) then raise exception 'Imported child mismatch'; end if;
  select id into reward from public.rewards where slug=row->>'item_id';
  if reward is null then raise exception 'Unknown imported reward'; end if;
  insert into public.child_rewards(child_id,reward_id,earned_at) values(child,reward,(row->>'earned_at')::timestamptz);
 end loop;
 for row in select value from jsonb_array_elements(coalesce(p_bundle->'experience'->'placements','[]')) loop
  child:=(row->>'child_id')::uuid;
  if not exists(select 1 from public.child_profiles where id=child and parent_id=p_parent) then raise exception 'Imported child mismatch'; end if;
  select id into reward from public.rewards where slug=row->>'item_id';
  insert into public.world_item_placements(child_id,reward_id,slot) values(child,reward,row->>'slot');
 end loop;
 insert into private.import_receipts(parent_id,source_hash,child_map) values(p_parent,p_hash,p_bundle->'childMap');
 return jsonb_build_object('imported',jsonb_array_length(p_bundle->'profiles'));
end $$;
revoke all on function public.cq_import(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.cq_import(uuid,jsonb,text) to service_role;
update private.backend_metadata set version='202609180005';
commit;

