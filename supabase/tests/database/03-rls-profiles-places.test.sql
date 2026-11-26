begin;

select plan(17);

select tests.create_user('10000000-0000-0000-0000-000000000001', 'user@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000002', 'other@test.local');
select tests.create_user('10000000-0000-0000-0000-000000000003', 'admin@test.local');
select tests.set_user_role('10000000-0000-0000-0000-000000000003', 'admin');

insert into public.places (id, name, category, address)
values ('20000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor', 'Av. Siempre Viva 123');

select tests.authenticate_as_anon();

select isnt_empty('select id from public.profiles', 'a visitor can read profiles');
select isnt_empty('select id from public.places', 'a visitor can read places');
select throws_ok(
  $$ truncate public.places $$,
  '42501',
  null,
  'a visitor cannot truncate a table'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ update public.profiles set display_name = 'Nuevo nombre'
     where id = '10000000-0000-0000-0000-000000000001' $$,
  'a user can update their own display name'
);

update public.profiles set display_name = 'Hackeado' where id = '10000000-0000-0000-0000-000000000002';

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'a user cannot change their own role with a direct update'
);
select throws_ok(
  $$ insert into public.profiles (id, display_name, role)
     values ('10000000-0000-0000-0000-000000000009', 'Fake admin', 'admin') $$,
  '42501',
  null,
  'a user cannot insert a profile with the admin role'
);

select tests.clear_authentication();
grant update (role) on public.profiles to authenticated;
select tests.authenticate_as('10000000-0000-0000-0000-000000000001');

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000001' $$,
  '42501',
  'The role can only be changed through set_user_role',
  'the role guard rejects a role change even when the column is granted by mistake'
);

select throws_ok(
  $$ insert into public.places (name, category, address) values ('Mi taquería', 'birria', 'Calle 1') $$,
  '42501',
  null,
  'a user cannot create a place'
);

update public.places set name = 'Renombrada' where id = '20000000-0000-0000-0000-000000000001';
delete from public.places where id = '20000000-0000-0000-0000-000000000001';

select tests.clear_authentication();
revoke update (role) on public.profiles from authenticated;

select is(
  (select role from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'user'::public.user_role,
  'after every escalation attempt the user still has the user role'
);
select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000001'),
  'Nuevo nombre',
  'the own display name change was saved'
);
select is(
  (select display_name from public.profiles where id = '10000000-0000-0000-0000-000000000002'),
  'other',
  'a user cannot change another user profile'
);
select is(
  (select name from public.places where id = '20000000-0000-0000-0000-000000000001'),
  'Tacos El Güero',
  'a user cannot update or delete a place'
);

select tests.authenticate_as('10000000-0000-0000-0000-000000000003');

select lives_ok(
  $$ insert into public.places (name, category, address)
     values ('Birria Creada Por Admin', 'birria', 'Calle 2') $$,
  'an admin can create a place'
);
select is(
  (select created_by from public.places where name = 'Birria Creada Por Admin'),
  '10000000-0000-0000-0000-000000000003'::uuid,
  'a new place records the admin who created it'
);
select throws_ok(
  $$ update public.places set average_rating = 5 where id = '20000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'not even an admin can write the average rating directly'
);
select lives_ok(
  $$ update public.places set name = 'Tacos El Güero Centro' where id = '20000000-0000-0000-0000-000000000001' $$,
  'an admin can update a place'
);
select lives_ok(
  $$ delete from public.places where name = 'Birria Creada Por Admin' $$,
  'an admin can delete a place'
);

select * from finish();

rollback;
