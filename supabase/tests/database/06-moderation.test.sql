begin;

select plan(20);

select tests.create_user('10000000-0000-0000-0000-000000000001', 'ana@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000002', 'beto@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000003', 'moderator@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000004', 'admin@test.local');
select tests.set_user_role('10000000-0000-0000-0000-000000000003', 'moderator');
select tests.set_user_role('10000000-0000-0000-0000-000000000004', 'admin');

insert into public.places (id, name, category, address)
values ('20000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor', 'Calle 1');

insert into public.reviews (id, place_id, user_id, rating, body) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 5, 'Buenísimo'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Spam');

insert into public.reports (id, review_id, reported_by, reason)
values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Spam');

select is(
  (select array_agg(proname::text order by proname::text) from pg_proc where pronamespace = 'public'::regnamespace),
  array['resolve_report', 'set_review_hidden', 'set_user_role'],
  'the API schema only exposes the three moderation functions'
);
select is_empty(
  $$ select p.oid::regprocedure
     from pg_proc p
     where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
       and p.prosecdef
       and not coalesce(p.proconfig @> array['search_path=""'], false) $$,
  'every security definer function has an empty search_path'
);
select ok(
  not has_function_privilege('anon', 'public.set_user_role(uuid, public.user_role)', 'execute')
  and not has_function_privilege('anon', 'public.set_review_hidden(uuid, boolean)', 'execute')
  and not has_function_privilege('anon', 'public.resolve_report(uuid, public.report_status)', 'execute'),
  'a visitor cannot execute the moderation functions'
);
select ok(
  not has_function_privilege('anon', 'private.handle_new_user()', 'execute')
  and not has_function_privilege('authenticated', 'private.recalculate_place_rating(uuid)', 'execute'),
  'internal private functions are not executable by API roles'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000001');

select throws_ok(
  $$ select public.set_user_role('10000000-0000-0000-0000-000000000001', 'admin') $$,
  '42501',
  'Only admins can change roles',
  'a user cannot promote themselves with set_user_role'
);
select throws_ok(
  $$ select public.set_review_hidden('30000000-0000-0000-0000-000000000002', true) $$,
  '42501',
  'Only moderators and admins can hide reviews',
  'a user cannot hide reviews'
);
select throws_ok(
  $$ select public.resolve_report('40000000-0000-0000-0000-000000000001', 'accepted') $$,
  '42501',
  'Only moderators and admins can resolve reports',
  'a user cannot resolve reports'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.set_user_role('10000000-0000-0000-0000-000000000003', 'admin') $$,
  '42501',
  'Only admins can change roles',
  'a moderator cannot promote themselves to admin'
);
select lives_ok(
  $$ select public.set_review_hidden('30000000-0000-0000-0000-000000000001', true) $$,
  'a moderator can hide a review'
);
select lives_ok(
  $$ select public.set_review_hidden('30000000-0000-0000-0000-000000000001', false) $$,
  'a moderator can unhide a review'
);
select throws_ok(
  $$ select public.resolve_report('40000000-0000-0000-0000-000000000001', 'pending') $$,
  '22023',
  'A report can only be resolved as accepted or rejected',
  'a report cannot be resolved back to pending'
);
select lives_ok(
  $$ select public.resolve_report('40000000-0000-0000-0000-000000000001', 'accepted') $$,
  'a moderator can accept a report'
);
select throws_ok(
  $$ select public.resolve_report('40000000-0000-0000-0000-000000000001', 'rejected') $$,
  'P0002',
  'Report not found or already resolved',
  'a resolved report cannot be resolved again'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000004');

select throws_ok(
  $$ select public.set_user_role('10000000-0000-0000-0000-000000000004', 'user') $$,
  '42501',
  'Admins cannot change their own role',
  'an admin cannot change their own role'
);
select lives_ok(
  $$ select public.set_user_role('10000000-0000-0000-0000-000000000002', 'moderator') $$,
  'an admin can change the role of another user'
);
select throws_ok(
  $$ select public.set_user_role('10000000-0000-0000-0000-000000000099', 'moderator') $$,
  'P0002',
  'User not found',
  'changing the role of a missing user fails'
);

select tests.clear_authentication();

select is(
  (select role from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'user'::public.user_role,
  'the user who tried to promote themselves is still a user'
);
select is(
  (select role from public.profiles where id = '10000000-0000-0000-0000-000000000002'),
  'moderator'::public.user_role,
  'the promoted user is now a moderator'
);
select ok(
  (select is_hidden from public.reviews where id = '30000000-0000-0000-0000-000000000002'),
  'accepting a report through resolve_report hides the review'
);
select is(
  (select resolved_by from public.reports where id = '40000000-0000-0000-0000-000000000001'),
  '10000000-0000-0000-0000-000000000003'::uuid,
  'the report records the moderator who resolved it'
);

select * from finish();

rollback;
