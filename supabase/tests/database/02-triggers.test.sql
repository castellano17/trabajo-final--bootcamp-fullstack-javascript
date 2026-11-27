begin;

select plan(13);

select tests.create_user(
  '10000000-0000-0000-0000-000000000001', 'ana@test.local', '{"display_name": "Ana"}'
);
select tests.create_user(
  '10000000-0000-0000-0000-000000000002', 'intruder@test.local', '{"display_name": "Intruder", "role": "admin"}'
);
select tests.create_user('10000000-0000-0000-0000-000000000003', 'beto@test.local');

select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'Ana',
  'signing up creates a profile with the display name from the sign-up metadata'
);
select is(
  (select role from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'user'::public.user_role,
  'a new profile gets the user role'
);
select is(
  (select role from public.profiles where id = '10000000-0000-0000-0000-000000000002'),
  'user'::public.user_role,
  'signing up with role admin in the metadata still creates a user profile'
);
select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000003'),
  'beto',
  'without a display name the profile uses the local part of the email'
);

insert into public.places (id, name, category, address, updated_at)
values ('20000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor', 'Av. Siempre Viva 123', '2000-01-01');

update public.places set name = 'Tacos El Güero II' where id = '20000000-0000-0000-0000-000000000001';

select ok(
  (select updated_at > '2000-01-01' from public.places where id = '20000000-0000-0000-0000-000000000001'),
  'updating a row refreshes updated_at'
);

insert into public.reviews (id, place_id, user_id, rating, body) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 5, 'Buenísimo'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 3, 'Normal');

select is(
  (select format('%s/%s', average_rating, review_count) from public.places where id = '20000000-0000-0000-0000-000000000001'),
  '4.00/2',
  'creating reviews updates the place average and count'
);

update public.reviews set rating = 1 where id = '30000000-0000-0000-0000-000000000002';

select is(
  (select format('%s/%s', average_rating, review_count) from public.places where id = '20000000-0000-0000-0000-000000000001'),
  '3.00/2',
  'editing a review rating updates the place average'
);

update public.reviews set is_hidden = true where id = '30000000-0000-0000-0000-000000000002';

select is(
  (select format('%s/%s', average_rating, review_count) from public.places where id = '20000000-0000-0000-0000-000000000001'),
  '5.00/1',
  'hiding a review removes it from the place average and count'
);

delete from public.reviews where id = '30000000-0000-0000-0000-000000000002';

select is(
  (select format('%s/%s', average_rating, review_count) from public.places where id = '20000000-0000-0000-0000-000000000001'),
  '5.00/1',
  'deleting a hidden review leaves the visible average unchanged'
);

delete from public.reviews where id = '30000000-0000-0000-0000-000000000001';

select is(
  (select format('%s/%s', average_rating, review_count) from public.places where id = '20000000-0000-0000-0000-000000000001'),
  '0.00/0',
  'deleting the last visible review resets the place average and count'
);

insert into public.reviews (id, place_id, user_id, rating, body)
values ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 4, 'Rico');

select lives_ok(
  $$ insert into public.review_photos (review_id, storage_path) values
       ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d.jpg'),
       ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e.jpg'),
       ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f.jpg') $$,
  'a review accepts three photos'
);
select throws_ok(
  $$ insert into public.review_photos (review_id, storage_path)
     values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001/30000000-0000-0000-0000-000000000003/4d5e6f7a-8b9c-4d0e-9f1a-3b4c5d6e7f8a.jpg') $$,
  '23514',
  null,
  'the fourth photo of a review is rejected'
);

insert into public.reports (id, review_id, reported_by, reason)
values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Spam');

update public.reports set status = 'accepted' where id = '40000000-0000-0000-0000-000000000001';

select ok(
  (select is_hidden from public.reviews where id = '30000000-0000-0000-0000-000000000003'),
  'accepting a report hides its review'
);

select * from finish();

rollback;
