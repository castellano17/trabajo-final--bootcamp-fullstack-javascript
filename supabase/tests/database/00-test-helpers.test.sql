create extension if not exists pgtap with schema extensions;

create schema if not exists tests;

create or replace function tests.create_user(
  user_id uuid,
  email text,
  metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  )
  values (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated',
    'authenticated', email, '', metadata, '{}'::jsonb, now(), now()
  );

  insert into public.profiles (id, display_name)
  values (user_id, split_part(email, '@', 1))
  on conflict (id) do nothing;

  return user_id;
end;
$$;

create or replace function tests.set_user_role(
  user_id uuid,
  new_role public.user_role
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set role = new_role where id = user_id;
end;
$$;

create or replace function tests.authenticate_as(user_id uuid) returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_id, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.authenticate_as_anon() returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

create or replace function tests.clear_authentication() returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;
grant execute on all functions in schema extensions to anon, authenticated;

select plan(1);
select ok(true, 'test helpers are installed');
select * from finish();
