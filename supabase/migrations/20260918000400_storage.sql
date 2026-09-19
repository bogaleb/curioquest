begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('curriculum-media','curriculum-media',false,10485760,array['image/png','image/jpeg','image/webp','audio/mpeg','audio/wav','video/mp4','text/vtt']),
 ('family-media','family-media',false,10485760,array['image/png','image/jpeg','image/webp','audio/mpeg','audio/wav','video/mp4','text/vtt'])
 on conflict(id) do nothing;
create policy cq_curriculum_media_read on storage.objects for select to authenticated using(
 bucket_id='curriculum-media' and exists(select 1 from public.media_assets m where m.bucket=bucket_id and m.object_path=name and m.parent_id is null and m.published)
);
create policy cq_family_media_read on storage.objects for select to authenticated using(
 bucket_id='family-media' and (storage.foldername(name))[1]=(select auth.uid())::text
);
-- Uploads go through the PIN-gated server API with bounded size, signature and owner checks.
-- No browser INSERT/UPDATE/DELETE policy is granted.
alter table public.child_achievements drop constraint child_achievements_source_session_id_child_id_fkey;
alter table public.child_achievements add constraint child_achievements_source_session_id_child_id_fkey
 foreign key(source_session_id,child_id) references public.learning_sessions(id,child_id) on delete cascade;
update private.backend_metadata set version='202609180004';
commit;
