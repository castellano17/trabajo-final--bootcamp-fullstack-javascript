begin;

select plan(12);

select tests.create_user('80000000-0000-0000-0000-000000000001', 'photo-owner@test.local');
select tests.create_user('80000000-0000-0000-0000-000000000002', 'photo-other@test.local');

insert into public.places (id, name, category, address) values
  ('81000000-0000-0000-0000-000000000001', 'Tacos Uno', 'pastor', 'Calle 1'),
  ('81000000-0000-0000-0000-000000000002', 'Tacos Dos', 'birria', 'Calle 2');

insert into public.reviews (id, place_id, user_id, rating, body) values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 5, 'Rico'),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 4, 'Bueno'),
  ('82000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002', 3, 'Normal');

insert into storage.objects (bucket_id, name, owner_id)
values ('review-photos', '80000000-0000-0000-0000-000000000002/82000000-0000-0000-0000-000000000003/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp', '80000000-0000-0000-0000-000000000002');

select is(
  (select public from storage.buckets where id = 'review-photos'),
  true,
  'the review-photos bucket exists and is publicly readable'
);
select is(
  (select file_size_limit from storage.buckets where id = 'review-photos'),
  2097152::bigint,
  'the review-photos bucket limits files to 2 MB'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'review-photos'),
  array['image/jpeg', 'image/png', 'image/webp'],
  'the review-photos bucket only accepts JPEG, PNG and WebP'
);

select tests.authenticate_as('80000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('review-photos', '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp', '80000000-0000-0000-0000-000000000001') $$,
  'a user can upload a review photo to their own folder'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('review-photos', '80000000-0000-0000-0000-000000000002/82000000-0000-0000-0000-000000000003/9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a.webp', '80000000-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'a user cannot upload a review photo to another user''s folder'
);

select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects
where bucket_id = 'review-photos'
  and name = '80000000-0000-0000-0000-000000000002/82000000-0000-0000-0000-000000000003/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp';
delete from storage.objects
where bucket_id = 'review-photos'
  and name = '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp';

select tests.clear_authentication();

select isnt_empty(
  $$ select 1 from storage.objects
     where name = '80000000-0000-0000-0000-000000000002/82000000-0000-0000-0000-000000000003/2b1e4c2a-8d0f-4b6e-9a3c-5f7d1e2a3b4c.webp' $$,
  'a user cannot delete a review photo in another user''s folder'
);
select is_empty(
  $$ select 1 from storage.objects
     where name = '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000001/6c0a1b2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d.webp' $$,
  'a user can delete a review photo in their own folder'
);

select tests.authenticate_as_anon();

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('review-photos', '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000001/0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d.webp') $$,
  '42501',
  null,
  'a visitor cannot upload files to the review-photos bucket'
);

select tests.authenticate_as('80000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('82000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000001/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f.webp') $$,
  'the author can add a photo stored in their folder for that review'
);
select throws_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('82000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002/82000000-0000-0000-0000-000000000001/4d5e6f7a-8b9c-4d0e-9f1a-2b3c4d5e6f7a.webp') $$,
  '42501',
  null,
  'review_photos rejects a path inside another user''s folder'
);
select throws_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('82000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000002/5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b.webp') $$,
  '42501',
  null,
  'review_photos rejects a path inside the folder of another review'
);
select throws_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('82000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001/82000000-0000-0000-0000-000000000001/photo.jpg') $$,
  '23514',
  null,
  'review_photos rejects a path with an invalid format'
);

select * from finish();

rollback;
