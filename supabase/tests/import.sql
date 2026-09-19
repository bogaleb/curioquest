begin;
insert into auth.users(id) values ('c0000000-0000-4000-8000-000000000001');
set local role service_role;
do $$
declare bundle jsonb; result jsonb;
begin
 bundle:=jsonb_build_object('profiles',jsonb_build_array(jsonb_build_object(
  'id','c0000000-0000-4000-8000-000000000002','name','Imported','grade','prek','avatar','fox',
  'dailyGoal',10,'controls','{}'::jsonb,'preferences','{}'::jsonb,'interests','[]'::jsonb,'stars',12)),
  'childMap',jsonb_build_object('legacy','c0000000-0000-4000-8000-000000000002'));
 result:=public.cq_import('c0000000-0000-4000-8000-000000000001',bundle,'test-receipt');
 if (result->>'imported')::int<>1 then raise exception 'Import failed'; end if;
 result:=public.cq_import('c0000000-0000-4000-8000-000000000001',bundle,'test-receipt');
 if result->>'alreadyImported'<>'true' then raise exception 'Import replay not detected'; end if;
 result:=public.cq_read('c0000000-0000-4000-8000-000000000001','explorers');
 if jsonb_array_length(result)<>1 then raise exception 'Import duplicated a child'; end if;
end $$;
reset role;
do $$ begin
 if (select sum(amount) from public.reward_events where child_id='c0000000-0000-4000-8000-000000000002')<>12 then raise exception 'Imported opening balance is wrong'; end if;
end $$;
rollback;
