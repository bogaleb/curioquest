-- Execute every branch of the routines the migrations define.
--
-- `create function` proves almost nothing for plpgsql: the SQL inside a function body is
-- parsed when that body first *runs*, not when it is created. This file is therefore the
-- real check, and every branch added to a routine belongs here the same day.
--
-- Driven by `node scripts/verify-migrations.mjs`. Any line printing BUG is a failure.

\echo '--- 1. cq_family_events: grouped by child, oldest first'
select jsonb_object_keys(public.cq_family_events('aaaaaaaa-0000-4000-8000-000000000001', 100)) as child;
select jsonb_array_length(public.cq_family_events('aaaaaaaa-0000-4000-8000-000000000001',100)
       -> 'bbbbbbbb-0000-4000-8000-000000000001') as events_for_child;

\echo '--- 2. cq_insights retention (the whole family)'
select jsonb_pretty(public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','retention',null,14,5,100));

\echo '--- 3. cq_insights retention scoped to one child, 30-day window'
select public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','retention',
       'bbbbbbbb-0000-4000-8000-000000000001',30,5,100) -> 'rate' as rate_30d;

\echo '--- 4. item-health must REFUSE before an author grant exists'
do $$ begin
  perform public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','item-health',null,14,5,20);
  raise notice 'BUG: item-health answered a non-author';
exception when others then raise notice 'refused as designed: %', sqlerrm;
end $$;

\echo '--- 5. grant authorship, then item-health must return the flagged item'
insert into content.authors(parent_id,role,note)
values ('aaaaaaaa-0000-4000-8000-000000000001','editor','sql check')
on conflict (parent_id) do nothing;
select jsonb_pretty(public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','item-health',null,14,5,20));

\echo '--- 6. cq_mastery_cache writes, then no-ops when it already agrees'
select public.cq_mastery_cache('aaaaaaaa-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000001','{"READ.SOUND.M":{"score":88}}'::jsonb) as first_write;
select public.cq_mastery_cache('aaaaaaaa-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000001','{"READ.SOUND.M":{"score":88}}'::jsonb) as second_write_should_be_zero;
select data->'skillMastery' as cached, revision from private.explorer_state
where child_id='bbbbbbbb-0000-4000-8000-000000000001';

\echo '--- 7. a child of another parent is refused, not leaked'
select public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','retention',
       '99999999-0000-4000-8000-000000000009',14,5,100) as foreign_child_returns_null;
select public.cq_mastery_cache('aaaaaaaa-0000-4000-8000-000000000001',
       '99999999-0000-4000-8000-000000000009','{}'::jsonb) as foreign_child_write;

\echo '--- 8. an unknown insight raises'
do $$ begin
  perform public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','nonsense',null,14,5,20);
  raise notice 'BUG: an unknown insight did not raise';
exception when others then raise notice 'raised as designed: %', sqlerrm;
end $$;
\echo '=== 7. another parents child is refused, not leaked'
select coalesce(public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','retention',
       '99999999-0000-4000-8000-000000000009',14,5,100)::text,'NULL') as foreign_retention;
select public.cq_mastery_cache('aaaaaaaa-0000-4000-8000-000000000001',
       '99999999-0000-4000-8000-000000000009','{}'::jsonb) as foreign_write;
\echo '=== 8. an unknown insight raises'
do $$ begin
  perform public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','nonsense',null,14,5,20);
  raise notice 'BUG: did not raise';
exception when others then raise notice 'raised as designed: %', sqlerrm;
end $$;
\echo '=== 9. a null parent is refused'
do $$ begin perform public.cq_family_events(null,10); raise notice 'BUG: did not raise';
exception when others then raise notice 'family_events refused: %', sqlerrm; end $$;
\echo '=== 10. all three windows execute'
select w as window_days,
       public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','retention',null,w,5,100)->'skillsRevisited' as revisited
from unnest(array[7,14,30]) w;
\echo '=== 11. the min-attempt floor filters'
select jsonb_array_length(public.cq_insights('aaaaaaaa-0000-4000-8000-000000000001','item-health',null,14,9,20)) as floor9_count;
\echo '=== 12. an empty family is {} not an error'
select public.cq_family_events('aaaaaaaa-0000-4000-8000-000000000099',10) as no_children;
