-- Transactional fixtures; run on local Supabase with psql or our disposable PG runner.
begin;
insert into auth.users(id) values
('10000000-0000-4000-8000-000000000001'), ('10000000-0000-4000-8000-000000000002');
insert into public.parents(id,display_name) values
('10000000-0000-4000-8000-000000000001','Parent A'), ('10000000-0000-4000-8000-000000000002','Parent B') on conflict(id) do update set display_name=excluded.display_name;
insert into public.child_profiles(id,parent_id,name,grade,avatar) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Child A','prek','fox'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Child B','grade1','rabbit');
insert into public.learning_sessions(id,child_id,kind) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','quest'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','quest');
insert into public.child_progress(child_id,skill_slug,domain) select id,'sound_m','reading' from public.child_profiles;
insert into public.subjects(id,slug,title,published) values
('40000000-0000-4000-8000-000000000001','test-reading','Reading',true),
('40000000-0000-4000-8000-000000000002','draft','Draft subject',false);
insert into public.units(id,subject_id,slug,title,grade,published) values
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','sounds','Sounds','prek',true),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','hidden','Hidden','prek',true);
insert into public.lessons(id,unit_id,slug,title,published) values
('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','m','M',true),
('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','hidden','Hidden',true);
insert into public.activities(id,lesson_id,slug,engine_kind,published) values
('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','m-choice','sound-choice',true),
('70000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','hidden','sound-choice',true);
insert into public.questions(id,activity_id,slug,prompt) values
('80000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','m-choice','Find m'),
('80000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002','hidden','Hidden');
insert into private.question_answers(question_id,answer) values ('80000000-0000-4000-8000-000000000001','"m"');
insert into public.activity_attempts(child_id,session_id,activity_id,question_id,mutation_id,response,correct,attempt_number)
select child_id,id,'70000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001',gen_random_uuid(),'"m"',true,1 from public.learning_sessions;
insert into public.achievements(id,slug,title,published) values ('90000000-0000-4000-8000-000000000001','first','First',true);
insert into public.child_achievements(child_id,achievement_id) select id,'90000000-0000-4000-8000-000000000001' from public.child_profiles;
insert into public.rewards(slug,title,kind,published) values ('star','Star','stars',true),('hidden','Hidden','stars',false);
insert into public.media_assets(parent_id,slug,title,media_type,published) values
(null,'public','Public','scene',true), (null,'hidden','Hidden','scene',false),
('10000000-0000-4000-8000-000000000001','a','A','image',false),
('10000000-0000-4000-8000-000000000002','b','B','image',false);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
declare t text; n integer;
begin
  foreach t in array array['parents','child_profiles','learning_sessions','activity_attempts','child_progress','child_achievements',
    'subjects','units','lessons','activities','questions','achievements','rewards'] loop
    if t in ('subjects','units','lessons','activities','questions','achievements','rewards') then continue; end if;
    execute format('select count(*) from public.%I',t) into n;
    if n <> 1 then raise exception 'RLS failed on %, saw % rows',t,n; end if;
  end loop;
  if (select name from public.child_profiles) <> 'Child A' then raise exception 'Wrong child visible'; end if;
  if exists(select 1 from public.questions where id='80000000-0000-4000-8000-000000000002') then raise exception 'Draft ancestor leaked a question'; end if;
  if not exists(select 1 from public.questions where id='80000000-0000-4000-8000-000000000001') then raise exception 'Published question not visible'; end if;
  begin
    perform public.cq_commit('10000000-0000-4000-8000-000000000002','create-explorer','{}');
    raise exception 'Authenticated client invoked privileged mutation';
  exception when insufficient_privilege then null; end;
  begin
    perform public.cq_read('10000000-0000-4000-8000-000000000002','export');
    raise exception 'Authenticated client invoked privileged read';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.media_assets where slug in ('public','hidden','a','b')) <> 2 then raise exception 'Media ownership failed'; end if;
  begin
    update public.child_profiles set parent_id='10000000-0000-4000-8000-000000000002';
    raise exception 'Direct ownership transfer was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.child_progress(child_id,skill_slug,domain) values ('20000000-0000-4000-8000-000000000001','forged','reading');
    raise exception 'Direct progress forgery was allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from private.question_answers;
    raise exception 'Private answers were exposed';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ begin
  if (select name from public.child_profiles) <> 'Child B' then raise exception 'Parent B isolation failed'; end if;
  if exists(select 1 from public.learning_sessions where child_id='20000000-0000-4000-8000-000000000001') then raise exception 'Other child session leaked'; end if;
end $$;

select set_config('request.jwt.claim.sub','',true);
do $$ begin
  if exists(select 1 from public.child_profiles) then raise exception 'Null identity leaked children'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  if public.backend_version() <> '202609180005' then raise exception 'Probe failed'; end if;
  begin
    perform * from public.child_profiles;
    raise exception 'Anonymous access leaked children';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

do $$ begin
  if exists (select 1 from pg_tables where schemaname='public' and not rowsecurity) then raise exception 'RLS missing on a table'; end if;
  begin
    insert into public.activity_attempts(child_id,session_id,activity_id,mutation_id,response,correct,attempt_number) values
    ('20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',gen_random_uuid(),'"m"',true,1);
    raise exception 'Cross-child session reference accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.activity_attempts(child_id,session_id,activity_id,question_id,mutation_id,response,correct,attempt_number) values
    ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000002',gen_random_uuid(),'"m"',true,1);
    raise exception 'Mismatched activity question accepted';
  exception when foreign_key_violation then null; end;
end $$;
rollback;
