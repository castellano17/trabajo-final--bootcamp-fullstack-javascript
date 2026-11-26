begin;

select plan(18);

select has_schema('private', 'private schema exists');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'places', 'places table exists');
select has_table('public', 'reviews', 'reviews table exists');
select has_table('public', 'review_photos', 'review_photos table exists');
select has_table('public', 'comments', 'comments table exists');
select has_table('public', 'review_votes', 'review_votes table exists');
select has_table('public', 'reports', 'reports table exists');

select enum_has_labels(
  'public', 'user_role', array['user', 'moderator', 'admin'],
  'user_role enum has the three roles'
);
select enum_has_labels(
  'public', 'report_status', array['pending', 'accepted', 'rejected'],
  'report_status enum has the three states'
);
select enum_has_labels(
  'public', 'place_category',
  array['pastor', 'birria', 'suadero', 'carnitas', 'barbacoa', 'canasta', 'guisado', 'mariscos', 'other'],
  'place_category enum has the taco categories'
);

create function public.default_privilege_probe() returns integer
language sql
as $$ select 1 $$;

select ok(
  not has_function_privilege('anon', 'public.default_privilege_probe()', 'execute'),
  'new functions are not executable by anon by default'
);
select ok(
  not has_function_privilege('authenticated', 'public.default_privilege_probe()', 'execute'),
  'new functions are not executable by authenticated by default'
);

select tests.create_user('10000000-0000-0000-0000-000000000001', 'author@test.local');

insert into public.places (id, name, category, address)
values ('20000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor', 'Av. Siempre Viva 123');

select throws_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body)
     values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0, 'Malo') $$,
  '23514',
  null,
  'a review with rating 0 is rejected'
);
select throws_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body)
     values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 6, 'Increíble') $$,
  '23514',
  null,
  'a review with rating 6 is rejected'
);
select lives_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body)
     values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 5, 'Buenísimo') $$,
  'a review with rating 5 is accepted'
);
select throws_ok(
  $$ insert into public.reviews (place_id, user_id, rating, body)
     values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 4, 'Otra vez') $$,
  '23505',
  null,
  'a second review by the same user on the same place is rejected'
);
select throws_ok(
  $$ insert into public.review_votes (review_id, user_id)
     (select id, user_id from public.reviews limit 1)
     union all
     (select id, user_id from public.reviews limit 1) $$,
  '23505',
  null,
  'a second helpful vote by the same user on the same review is rejected'
);

select * from finish();

rollback;
