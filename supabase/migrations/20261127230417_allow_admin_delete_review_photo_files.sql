create policy review_photos_select_admin
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'review-photos'
    and (select private.current_user_role()) = 'admin'
  );

create policy review_photos_delete_admin
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'review-photos'
    and (select private.current_user_role()) = 'admin'
  );
