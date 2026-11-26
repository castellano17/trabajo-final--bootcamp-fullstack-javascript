create function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.current_user_role() to anon, authenticated;

create function private.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'The role can only be changed through set_user_role'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger guard_profile_role
  before update on public.profiles
  for each row execute function private.guard_profile_role();

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create policy "Profiles are readable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter table public.places alter column created_by set default auth.uid();

alter table public.places enable row level security;

revoke all on public.places from anon, authenticated;
grant select on public.places to anon, authenticated;
grant insert (name, category, description, address) on public.places to authenticated;
grant update (name, category, description, address) on public.places to authenticated;
grant delete on public.places to authenticated;

create policy "Places are readable by everyone"
  on public.places for select
  to anon, authenticated
  using (true);

create policy "Admins create places"
  on public.places for insert
  to authenticated
  with check ((select private.current_user_role()) = 'admin');

create policy "Admins update places"
  on public.places for update
  to authenticated
  using ((select private.current_user_role()) = 'admin')
  with check ((select private.current_user_role()) = 'admin');

create policy "Admins delete places"
  on public.places for delete
  to authenticated
  using ((select private.current_user_role()) = 'admin');
