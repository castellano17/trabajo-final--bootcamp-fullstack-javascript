begin;

select plan(16);

select tests.create_user('10000000-0000-0000-0000-000000000001', 'ana@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000002', 'beto@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000003', 'moderator@test.local');
select tests.set_user_role('10000000-0000-0000-0000-000000000003', 'moderator');

insert into public.places (id, name, category, address) values
  ('20000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor', 'Calle 1'),
  ('20000000-0000-0000-0000-000000000002', 'Birria Don Pepe', 'birria', 'Calle 2');

insert into public.reviews (id, place_id, user_id, rating, body, is_hidden) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 5, 'Buenísimo', false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Reseña falsa', true);

insert into public.review_photos (review_id, storage_path) values
  ('30000000-0000-0000-0000-000000000001', 'reviews/visible.jpg'),
  ('30000000-0000-0000-0000-000000000002', 'reviews/hidden.jpg');

select tests.authenticate_as_anon();

select results_eq(
  $$ select id from public.reviews where place_id = '20000000-0000-0000-0000-000000000001' $$,
  $$ values ('30000000-0000-0000-0000-000000000001'::uuid) $$,
  'a visitor sees visible reviews and not hidden ones'
);
select results_eq(
  $$ select storage_path from public.review_photos where storage_path like 'reviews/%' $$,
  $$ values ('reviews/visible.jpg') $$,
  'a visitor sees photos of visible reviews only'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000002');

select isnt_empty(
  $$ select id from public.reviews where id = '30000000-0000-0000-0000-000000000002' $$,
  'the author still sees their hidden review'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000003');

select isnt_empty(
  $$ select id from public.reviews where id = '30000000-0000-0000-0000-000000000002' $$,
  'a moderator sees hidden reviews'
);
select throws_ok(
  $$ update public.reviews set is_hidden = false where id = '30000000-0000-0000-0000-000000000002' $$,
  '42501',
  null,
  'a moderator cannot unhide a review with a direct update'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000001');

select is_empty(
  $$ select id from public.reviews where id = '30000000-0000-0000-0000-000000000002' $$,
  'another user does not see a hidden review'
);
select lives_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body)
     values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 4, 'Muy rica') $$,
  'a user can create their own review'
);
select throws_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body)
     values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, 'Suplantación') $$,
  '42501',
  null,
  'a user cannot create a review on behalf of someone else'
);
select throws_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body, is_hidden)
     values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 3, 'Oculta', true) $$,
  '42501',
  null,
  'a user cannot create a review that is already hidden'
);
select throws_ok(
  $$ update public.reviews set is_hidden = true where id = '30000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'a user cannot change is_hidden on their own review'
);
select lives_ok(
  $$ update public.reviews set rating = 4, body = 'Muy bueno' where id = '30000000-0000-0000-0000-000000000001' $$,
  'a user can edit their own review'
);
select throws_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('30000000-0000-0000-0000-000000000002', 'reviews/intruder.jpg') $$,
  '42501',
  null,
  'a user cannot add photos to someone else review'
);
select lives_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('30000000-0000-0000-0000-000000000001', 'reviews/own.jpg') $$,
  'a user can add photos to their own review'
);

update public.reviews set body = 'Editada por otro' where id = '30000000-0000-0000-0000-000000000002';
delete from public.reviews where id = '30000000-0000-0000-0000-000000000002';

select tests.clear_authentication();

select is(
  (select body from public.reviews where id = '30000000-0000-0000-0000-000000000002'),
  'Reseña falsa',
  'a user cannot edit or delete someone else review'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ delete from public.reviews where id = '30000000-0000-0000-0000-000000000001' $$,
  'a user can delete their own review'
);

select tests.clear_authentication();

select is_empty(
  $$ select id from public.reviews where id = '30000000-0000-0000-0000-000000000001' $$,
  'the deleted review is gone'
);

select * from finish();

rollback;
