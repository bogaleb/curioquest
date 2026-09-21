-- A family, a child, and enough evidence that every branch has rows to chew on.
insert into auth.users(id,email) values ('aaaaaaaa-0000-4000-8000-000000000001','check@example.com');
-- public.parents is created by the trigger on auth.users, exactly as in production.
insert into public.child_profiles(id,parent_id,name,grade,avatar,daily_goal,controls,preferences)
values ('bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001',
        'Maya','prek','fox',10,'{}','{}');
insert into private.explorer_state(child_id,data)
values ('bbbbbbbb-0000-4000-8000-000000000001',
        '{"id":"bbbbbbbb-0000-4000-8000-000000000001","skillMastery":{"LEGACY.SKILL":{"score":42}}}');

-- One item answered many times: 8 wrong, 7 of them the same distractor (87.5% > 60%).
insert into public.learning_events
  (child_id,session_id,occurred_at,skill_id,item_id,verb,phase,correct,support,distractor,error_kind,catalogue_ver)
select 'bbbbbbbb-0000-4000-8000-000000000001','s1', now() - interval '40 days',
       'MATH.COUNT.1','item-a','say','guided',false,'none',
       case when g <= 7 then '4' else '2' end,'off-by-one','db-1'
from generate_series(1,8) g;

-- The same skill, learnt and then met again well after the window: one held, one slipped.
insert into public.learning_events
  (child_id,session_id,occurred_at,skill_id,item_id,verb,phase,correct,support,catalogue_ver)
values
 ('bbbbbbbb-0000-4000-8000-000000000001','s2', now() - interval '40 days','READ.SOUND.M','item-m','say','guided',true,'none','db-1'),
 ('bbbbbbbb-0000-4000-8000-000000000001','s3', now() - interval '2 days','READ.SOUND.M','item-m','build','independent',true,'none','db-1'),
 ('bbbbbbbb-0000-4000-8000-000000000001','s4', now() - interval '40 days','LOGIC.SORT.1','item-s','sort','guided',true,'none','db-1');
insert into public.learning_events
  (child_id,session_id,occurred_at,skill_id,item_id,verb,phase,correct,support,distractor,error_kind,catalogue_ver)
values
 ('bbbbbbbb-0000-4000-8000-000000000001','s5', now() - interval '1 day','LOGIC.SORT.1','item-s','sort','guided',false,'none','red','wrong-attribute','db-1');
-- Learnt yesterday and never revisited: must count as awaiting, not as forgotten.
insert into public.learning_events
  (child_id,session_id,occurred_at,skill_id,item_id,verb,phase,correct,support,catalogue_ver)
values ('bbbbbbbb-0000-4000-8000-000000000001','s6', now() - interval '1 day','MATH.COUNT.9','item-z','say','guided',true,'none','db-1');
