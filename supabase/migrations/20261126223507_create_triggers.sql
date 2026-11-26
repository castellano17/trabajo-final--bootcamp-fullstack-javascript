create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger set_places_updated_at
  before update on public.places
  for each row execute function private.set_updated_at();

create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function private.set_updated_at();

create trigger set_comments_updated_at
  before update on public.comments
  for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(split_part(new.email, '@', 1), ''),
        'usuario'
      ),
      50
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.recalculate_place_rating(target_place_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.places
  set
    average_rating = coalesce(
      (
        select round(avg(reviews.rating), 2)
        from public.reviews
        where reviews.place_id = target_place_id and not reviews.is_hidden
      ),
      0
    ),
    review_count = (
      select count(*)
      from public.reviews
      where reviews.place_id = target_place_id and not reviews.is_hidden
    )
  where places.id = target_place_id;
end;
$$;

create function private.refresh_place_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform private.recalculate_place_rating(old.place_id);
  end if;

  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.place_id is distinct from old.place_id) then
    perform private.recalculate_place_rating(new.place_id);
  end if;

  return null;
end;
$$;

create trigger refresh_place_rating
  after insert or update or delete on public.reviews
  for each row execute function private.refresh_place_rating();

create function private.enforce_review_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.review_id::text));

  if (select count(*) from public.review_photos where review_id = new.review_id) >= 3 then
    raise exception 'A review can have at most 3 photos'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger enforce_review_photo_limit
  before insert on public.review_photos
  for each row execute function private.enforce_review_photo_limit();

create function private.hide_review_on_accepted_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    update public.reviews set is_hidden = true where id = new.review_id;
  end if;

  return null;
end;
$$;

create trigger hide_review_on_accepted_report
  after update of status on public.reports
  for each row execute function private.hide_review_on_accepted_report();
