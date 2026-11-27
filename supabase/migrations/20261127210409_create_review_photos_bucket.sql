insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy review_photos_select_own
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy review_photos_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy review_photos_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter table public.review_photos
  add constraint review_photos_storage_path_format
  check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|png|jpg)$');

drop policy "Review authors add photos" on public.review_photos;

create policy "Review authors add photos"
  on public.review_photos for insert
  to authenticated
  with check (
    starts_with(storage_path, (select auth.uid())::text || '/' || review_id::text || '/')
    and exists (
      select 1 from public.reviews
      where reviews.id = review_photos.review_id and reviews.user_id = (select auth.uid())
    )
  );
