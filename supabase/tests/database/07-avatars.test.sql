begin;

select plan(18);

select tests.create_user('70000000-0000-0000-0000-000000000001', 'avatar-owner@test.local');
select tests.create_user('70000000-0000-0000-0000-000000000002', 'avatar-other@test.local');

insert into storage.objects (bucket_id, name, owner_id)
values ('avatars', '70000000-0000-0000-0000-000000000002/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp', '70000000-0000-0000-0000-000000000002');

select is(
  (select public from storage.buckets where id = 'avatars'),
  true,
  'the avatars bucket exists and is publicly readable'
);
select is(
  (select file_size_limit from storage.buckets where id = 'avatars'),
  2097152::bigint,
  'the avatars bucket limits files to 2 MB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'avatars'),
  array['image/jpeg', 'image/png', 'image/webp'],
  'the avatars bucket only accepts JPEG, PNG and WebP'
);

select tests.authenticate_as('70000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('avatars', '70000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp', '70000000-0000-0000-0000-000000000001') $$,
  'a user can upload a file to their own folder'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('avatars', '70000000-0000-0000-0000-000000000002/9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a.webp', '70000000-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'a user cannot upload a file to another user''s folder'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('avatars', 'avatar.webp', '70000000-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'a user cannot upload a file outside of any folder'
);
select is(
  (select array_agg(name) from storage.objects
   where bucket_id = 'avatars' and name like '70000000-0000-0000-0000-00000000000_/%'),
  array['70000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp'],
  'a user only lists the files in their own folder'
);

update storage.objects set metadata = '{"replaced": true}'::jsonb
where bucket_id = 'avatars' and name like '70000000-0000-0000-0000-00000000000_/%';

select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects
where bucket_id = 'avatars' and name = '70000000-0000-0000-0000-000000000002/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp';

select tests.clear_authentication();

select is(
  (select metadata ->> 'replaced' from storage.objects
   where name = '70000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp'),
  'true',
  'a user can replace a file in their own folder'
);
select is(
  (select metadata ->> 'replaced' from storage.objects
   where name = '70000000-0000-0000-0000-000000000002/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp'),
  null,
  'a user cannot replace a file in another user''s folder'
);
select isnt_empty(
  $$ select 1 from storage.objects
     where name = '70000000-0000-0000-0000-000000000002/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp' $$,
  'a user cannot delete a file in another user''s folder'
);

select tests.authenticate_as('70000000-0000-0000-0000-000000000001');
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects
where bucket_id = 'avatars' and name = '70000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp';
select tests.clear_authentication();

select is_empty(
  $$ select 1 from storage.objects
     where name = '70000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp' $$,
  'a user can delete a file in their own folder'
);

select tests.authenticate_as_anon();

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '70000000-0000-0000-0000-000000000001/0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d.webp') $$,
  '42501',
  null,
  'a visitor cannot upload files to the avatars bucket'
);
select is_empty(
  $$ select 1 from storage.objects
     where bucket_id = 'avatars' and name like '70000000-0000-0000-0000-00000000000_/%' $$,
  'a visitor cannot list the files of the avatars bucket'
);

select tests.authenticate_as('70000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ update public.profiles
     set avatar_url = '70000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp'
     where id = '70000000-0000-0000-0000-000000000001' $$,
  'avatar_url accepts a path inside the user''s own folder'
);
select throws_ok(
  $$ update public.profiles
     set avatar_url = '70000000-0000-0000-0000-000000000002/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp'
     where id = '70000000-0000-0000-0000-000000000001' $$,
  '23514',
  null,
  'avatar_url rejects a path inside another user''s folder'
);
select throws_ok(
  $$ update public.profiles
     set avatar_url = 'https://example.com/avatar.png'
     where id = '70000000-0000-0000-0000-000000000001' $$,
  '23514',
  null,
  'avatar_url rejects an external URL'
);
select throws_ok(
  $$ update public.profiles
     set avatar_url = '70000000-0000-0000-0000-000000000001/../70000000-0000-0000-0000-000000000002/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp'
     where id = '70000000-0000-0000-0000-000000000001' $$,
  '23514',
  null,
  'avatar_url rejects a path that walks out of the user''s folder'
);
select lives_ok(
  $$ update public.profiles set avatar_url = null
     where id = '70000000-0000-0000-0000-000000000001' $$,
  'avatar_url can be cleared'
);

select * from finish();

rollback;
