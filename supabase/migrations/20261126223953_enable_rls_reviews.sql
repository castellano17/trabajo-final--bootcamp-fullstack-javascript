alter table public.reviews enable row level security;

revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert (place_id, user_id, rating, body) on public.reviews to authenticated;
grant update (rating, body) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

create policy "Visible reviews are readable"
  on public.reviews for select
  to anon, authenticated
  using (
    not is_hidden
    or user_id = (select auth.uid())
    or (select private.current_user_role()) in ('moderator', 'admin')
  );

create policy "Users create their own reviews"
  on public.reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Authors update their reviews"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Authors delete their reviews"
  on public.reviews for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.review_photos enable row level security;

revoke all on public.review_photos from anon, authenticated;
grant select on public.review_photos to anon, authenticated;
grant insert (review_id, storage_path) on public.review_photos to authenticated;
grant delete on public.review_photos to authenticated;

create policy "Photos of visible reviews are readable"
  on public.review_photos for select
  to anon, authenticated
  using (exists (select 1 from public.reviews where reviews.id = review_photos.review_id));

create policy "Review authors add photos"
  on public.review_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews
      where reviews.id = review_photos.review_id and reviews.user_id = (select auth.uid())
    )
  );

create policy "Review authors delete photos"
  on public.review_photos for delete
  to authenticated
  using (
    exists (
      select 1 from public.reviews
      where reviews.id = review_photos.review_id and reviews.user_id = (select auth.uid())
    )
  );
