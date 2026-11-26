begin;

select plan(19);

select tests.create_user('10000000-0000-0000-0000-000000000001', 'ana@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000002', 'beto@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000003', 'moderator@test.local');
select tests.set_user_role('10000000-0000-0000-0000-000000000003', 'moderator');

insert into public.places (id, name, category, address) values
  ('20000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor', 'Calle 1'),
  ('20000000-0000-0000-0000-000000000002', 'Birria Don Pepe', 'birria', 'Calle 2');

insert into public.reviews (id, place_id, user_id, rating, body, is_hidden) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 5, 'Buenísimo', false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'Oculta', true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 4, 'De Beto', false);

insert into public.comments (id, review_id, user_id, body) values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Comentario en reseña oculta');

insert into public.reports (review_id, reported_by, reason)
values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Spam');

select tests.authenticate_as_anon();

select is_empty(
  $$ select id from public.comments where review_id = '30000000-0000-0000-0000-000000000002' $$,
  'a visitor does not see comments of hidden reviews'
);
select throws_ok(
  $$ insert into public.reports (review_id, reported_by, reason)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Spam') $$,
  '42501',
  null,
  'a visitor cannot report a review'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000002');

select lives_ok(
  $$ insert into public.comments (review_id, user_id, body)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Coincido') $$,
  'a user can comment on a visible review'
);
select throws_ok(
  $$ insert into public.comments (review_id, user_id, body)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Suplantación') $$,
  '42501',
  null,
  'a user cannot comment on behalf of someone else'
);
select throws_ok(
  $$ insert into public.comments (review_id, user_id, body)
     values ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Hola') $$,
  '42501',
  null,
  'a user cannot comment on a hidden review'
);
select lives_ok(
  $$ update public.comments set body = 'Coincido totalmente' where review_id = '30000000-0000-0000-0000-000000000001' $$,
  'a user can edit their own comment'
);
select lives_ok(
  $$ insert into public.review_votes (review_id, user_id)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002') $$,
  'a user can mark a review as helpful'
);
select throws_ok(
  $$ insert into public.review_votes (review_id, user_id)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002') $$,
  '23505',
  null,
  'a user cannot vote the same review twice'
);
select throws_ok(
  $$ insert into public.review_votes (review_id, user_id)
     values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002') $$,
  '42501',
  null,
  'a user cannot vote their own review'
);
select throws_ok(
  $$ insert into public.review_votes (review_id, user_id)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'a user cannot vote on behalf of someone else'
);
select lives_ok(
  $$ delete from public.review_votes
     where review_id = '30000000-0000-0000-0000-000000000001' and user_id = '10000000-0000-0000-0000-000000000002' $$,
  'a user can remove their own vote'
);
select lives_ok(
  $$ insert into public.reports (review_id, reported_by, reason)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Contenido ofensivo') $$,
  'a user can report someone else review'
);
select throws_ok(
  $$ insert into public.reports (review_id, reported_by, reason)
     values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Autodenuncia') $$,
  '42501',
  null,
  'a user cannot report their own review'
);
select is_empty(
  $$ select id from public.reports where review_id = '30000000-0000-0000-0000-000000000003' $$,
  'a user cannot read reports'
);
select throws_ok(
  $$ update public.reports set status = 'rejected' $$,
  '42501',
  null,
  'a user cannot resolve reports with a direct update'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000001');

update public.comments set body = 'Editado por otro' where review_id = '30000000-0000-0000-0000-000000000001';
delete from public.comments where review_id = '30000000-0000-0000-0000-000000000001';

select tests.clear_authentication();

select is(
  (select body from public.comments where review_id = '30000000-0000-0000-0000-000000000001'),
  'Coincido totalmente',
  'a user cannot edit or delete someone else comment'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000003');

select is(
  (select count(*)::integer from public.reports where review_id in ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003')),
  2,
  'a moderator can read all reports'
);
select throws_ok(
  $$ update public.reports set status = 'rejected' $$,
  '42501',
  null,
  'a moderator cannot resolve reports with a direct update'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000002');

select lives_ok(
  $$ delete from public.comments where review_id = '30000000-0000-0000-0000-000000000001' $$,
  'a user can delete their own comment'
);

select * from finish();

rollback;
