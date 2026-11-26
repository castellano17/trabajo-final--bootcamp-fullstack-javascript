alter table public.comments enable row level security;

revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (review_id, user_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

create policy "Comments of visible reviews are readable"
  on public.comments for select
  to anon, authenticated
  using (exists (select 1 from public.reviews where reviews.id = comments.review_id));

create policy "Users comment on visible reviews as themselves"
  on public.comments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.reviews
      where reviews.id = comments.review_id and not reviews.is_hidden
    )
  );

create policy "Authors update their comments"
  on public.comments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Authors delete their comments"
  on public.comments for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.review_votes enable row level security;

revoke all on public.review_votes from anon, authenticated;
grant select on public.review_votes to anon, authenticated;
grant insert (review_id, user_id) on public.review_votes to authenticated;
grant delete on public.review_votes to authenticated;

create policy "Votes of visible reviews are readable"
  on public.review_votes for select
  to anon, authenticated
  using (exists (select 1 from public.reviews where reviews.id = review_votes.review_id));

create policy "Users vote visible reviews of others"
  on public.review_votes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.reviews
      where reviews.id = review_votes.review_id
        and not reviews.is_hidden
        and reviews.user_id <> (select auth.uid())
    )
  );

create policy "Users remove their own votes"
  on public.review_votes for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.reports enable row level security;

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (review_id, reported_by, reason) on public.reports to authenticated;

create policy "Moderators read reports"
  on public.reports for select
  to authenticated
  using ((select private.current_user_role()) in ('moderator', 'admin'));

create policy "Users report visible reviews of others"
  on public.reports for insert
  to authenticated
  with check (
    reported_by = (select auth.uid())
    and exists (
      select 1 from public.reviews
      where reviews.id = reports.review_id
        and not reviews.is_hidden
        and reviews.user_id <> (select auth.uid())
    )
  );
