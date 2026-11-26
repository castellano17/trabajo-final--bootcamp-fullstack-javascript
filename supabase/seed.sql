insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  seed_user.id,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  seed_user.email,
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('display_name', seed_user.display_name),
  now(),
  now(),
  '', '', '', ''
from (
  values
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'user@resenit.test', 'Usuaria Demo'),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'moderator@resenit.test', 'Moderador Demo'),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'admin@resenit.test', 'Admin Demo')
) as seed_user (id, email, display_name);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  users.id,
  users.id::text,
  'email',
  jsonb_build_object('sub', users.id::text, 'email', users.email, 'email_verified', true),
  now(),
  now(),
  now()
from auth.users
where users.email like '%@resenit.test';

update public.profiles set role = 'moderator' where id = 'a0000000-0000-0000-0000-000000000002';
update public.profiles set role = 'admin' where id = 'a0000000-0000-0000-0000-000000000003';

insert into public.places (id, name, category, description, address, created_by) values
  ('b0000000-0000-0000-0000-000000000001', 'Tacos El Güero', 'pastor',
   'Tacos al pastor con piña asada al trompo.', 'Av. Insurgentes Sur 1234, Ciudad de México',
   'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000002', 'Birria Don Pepe', 'birria',
   'Birria de res con consomé y tortillas hechas a mano.', 'Calle Morelos 45, Guadalajara',
   'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000003', 'Suadero La Esquina', 'suadero',
   'Puesto callejero de suadero y longaniza.', 'Eje Central 210, Ciudad de México',
   'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000004', 'Carnitas Michoacán', 'carnitas',
   'Carnitas estilo Quiroga por kilo o en taco.', 'Av. Revolución 880, Morelia',
   'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000005', 'Mariscos El Faro', 'mariscos',
   'Tacos de pescado y camarón capeado.', 'Malecón 15, Ensenada',
   'a0000000-0000-0000-0000-000000000003');

insert into public.reviews (place_id, user_id, rating, body) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 5,
   'El mejor pastor que he probado, la salsa verde es increíble.'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 4,
   'Muy buenos tacos, aunque hay que esperar en la noche.'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 4,
   'El consomé está riquísimo. Las porciones son generosas.'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 5,
   'Birria perfecta para un domingo.'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 3,
   'Sabor correcto, pero la tortilla llegó fría.'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 2,
   'Las carnitas estaban secas esta vez.');
