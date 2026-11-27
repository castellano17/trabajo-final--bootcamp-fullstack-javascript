begin;

select plan(18);

select tests.create_user('90000000-0000-0000-0000-000000000001', 'share-admin@test.local');
select tests.create_user('90000000-0000-0000-0000-000000000002', 'share-moderator@test.local');
select tests.create_user('90000000-0000-0000-0000-000000000003', 'share-author@test.local');
select tests.set_user_role('90000000-0000-0000-0000-000000000001', 'admin');
select tests.set_user_role('90000000-0000-0000-0000-000000000002', 'moderator');

insert into storage.objects (bucket_id, name, owner_id) values
  ('review-photos', '90000000-0000-0000-0000-000000000003/91000000-0000-0000-0000-000000000001/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d.webp', '90000000-0000-0000-0000-000000000003'),
  ('review-photos', '90000000-0000-0000-0000-000000000003/91000000-0000-0000-0000-000000000002/2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e.webp', '90000000-0000-0000-0000-000000000003'),
  ('avatars', '90000000-0000-0000-0000-000000000003/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f.webp', '90000000-0000-0000-0000-000000000003');

insert into public.places (id, name, category, address) values
  ('92000000-0000-0000-0000-000000000001', 'Ñandú Güero Pruebas', 'pastor', 'Calle 1'),
  ('92000000-0000-0000-0000-000000000002', 'Ñandú Güero Pruebas', 'pastor', 'Calle 2'),
  ('92000000-0000-0000-0000-000000000003', 'Nuevo', 'birria', 'Calle 3'),
  ('92000000-0000-0000-0000-000000000004', '🌮🌮', 'other', 'Calle 4'),
  ('92000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-00000000aaaa', 'other', 'Calle 5'),
  ('92000000-0000-0000-0000-000000000006', repeat('taco ', 20), 'other', 'Calle 6');

select tests.authenticate_as('90000000-0000-0000-0000-000000000001');

update public.places set name = 'Ñandú Güero Renombrado' where id = '92000000-0000-0000-0000-000000000001';

select is(
  (select slug from public.places where id = '92000000-0000-0000-0000-000000000001'),
  'nandu-guero-pruebas',
  'renaming a place keeps its slug, so its links and QR keep working'
);
select is(
  (select slug from public.places where id = '92000000-0000-0000-0000-000000000002'),
  'nandu-guero-pruebas-2',
  'a place with the name of an existing one gets the slug with -2'
);
select is(
  (select slug from public.places where id = '92000000-0000-0000-0000-000000000003'),
  'nuevo-2',
  'a place named Nuevo gets nuevo-2 because nuevo is reserved'
);
select is(
  (select slug from public.places where id = '92000000-0000-0000-0000-000000000004'),
  'lugar',
  'a name without letters or numbers gets the slug lugar'
);
select is(
  (select slug from public.places where id = '92000000-0000-0000-0000-000000000005'),
  'b0000000-0000-0000-0000-00000000aaaa-2',
  'a slug shaped like a UUID gets a suffix'
);
select ok(
  (select char_length(slug) <= 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
   from public.places where id = '92000000-0000-0000-0000-000000000006'),
  'a long name gets a slug of at most 60 characters without a trailing hyphen'
);

select throws_ok(
  $$ insert into public.places (name, category, address, slug) values ('Con Slug', 'other', 'Calle 7', 'mi-slug') $$,
  '42501',
  null,
  'the admin cannot choose the slug of a new place'
);
select throws_ok(
  $$ update public.places set slug = 'otro-slug' where id = '92000000-0000-0000-0000-000000000003' $$,
  '42501',
  null,
  'the admin cannot change the slug of a place'
);

select throws_ok(
  $$ update public.places set maps_url = 'http://maps.google.com/?q=tacos' where id = '92000000-0000-0000-0000-000000000003' $$,
  '23514',
  null,
  'maps_url rejects a Google Maps link without https'
);
select throws_ok(
  $$ update public.places set maps_url = 'https://otro-sitio.com/maps' where id = '92000000-0000-0000-0000-000000000003' $$,
  '23514',
  null,
  'maps_url rejects a link from another site'
);
select lives_ok(
  $$ update public.places set maps_url = 'https://maps.app.goo.gl/AbCdEf123' where id = '92000000-0000-0000-0000-000000000003' $$,
  'maps_url accepts a maps.app.goo.gl link'
);

select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects
where bucket_id = 'review-photos'
  and name = '90000000-0000-0000-0000-000000000003/91000000-0000-0000-0000-000000000001/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d.webp';
delete from storage.objects
where bucket_id = 'avatars'
  and name = '90000000-0000-0000-0000-000000000003/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f.webp';

select tests.authenticate_as('90000000-0000-0000-0000-000000000002');

delete from storage.objects
where bucket_id = 'review-photos'
  and name = '90000000-0000-0000-0000-000000000003/91000000-0000-0000-0000-000000000002/2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e.webp';

select tests.clear_authentication();

select is_empty(
  $$ select 1 from storage.objects
     where name = '90000000-0000-0000-0000-000000000003/91000000-0000-0000-0000-000000000001/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d.webp' $$,
  'the admin can delete a review photo in another user''s folder'
);
select isnt_empty(
  $$ select 1 from storage.objects
     where name = '90000000-0000-0000-0000-000000000003/3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f.webp' $$,
  'the admin cannot delete another user''s avatar'
);
select isnt_empty(
  $$ select 1 from storage.objects
     where name = '90000000-0000-0000-0000-000000000003/91000000-0000-0000-0000-000000000002/2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e.webp' $$,
  'a moderator cannot delete a review photo in another user''s folder'
);

insert into public.reviews (id, place_id, user_id, rating, body, is_hidden)
values ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000003', 2, 'Oculta', true);
insert into public.review_photos (review_id, storage_path)
values ('93000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000003/93000000-0000-0000-0000-000000000001/4d5e6f7a-8b9c-4d0e-9f1a-2b3c4d5e6f7a.webp');

select tests.authenticate_as('90000000-0000-0000-0000-000000000001');
select isnt_empty(
  $$ select storage_path from public.review_photos
     where review_id = '93000000-0000-0000-0000-000000000001' $$,
  'the admin can read the photo paths of a hidden review, so deleting its place also removes them'
);
select tests.clear_authentication();

insert into public.places (name, category, address, slug)
values ('Insertado Por Postgres', 'other', 'Calle 8', 'slug-elegido');

select is(
  (select slug from public.places where name = 'Insertado Por Postgres'),
  'insertado-por-postgres',
  'a slug sent on insert is replaced by the generated one'
);
select col_not_null('public', 'places', 'slug', 'every place has a slug');
select col_is_unique('public', 'places', 'slug', 'slugs are unique');

select * from finish();

rollback;
