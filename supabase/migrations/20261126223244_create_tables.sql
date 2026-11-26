create schema private;

alter default privileges for role postgres revoke execute on functions from public;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

create type public.user_role as enum ('user', 'moderator', 'admin');

create type public.report_status as enum ('pending', 'accepted', 'rejected');

create type public.place_category as enum (
  'pastor', 'birria', 'suadero', 'carnitas', 'barbacoa', 'canasta', 'guisado', 'mariscos', 'other'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  category public.place_category not null,
  description text not null default '' check (char_length(description) <= 1000),
  address text not null check (char_length(address) between 1 and 200),
  average_rating numeric(3, 2) not null default 0 check (average_rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_created_by_idx on public.places (created_by);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id)
);

create index reviews_user_id_idx on public.reviews (user_id);

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index review_photos_review_id_idx on public.review_photos (review_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_review_id_idx on public.comments (review_id);
create index comments_user_id_idx on public.comments (user_id);

create table public.review_votes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index review_votes_user_id_idx on public.review_votes (user_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reported_by uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status public.report_status not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (review_id, reported_by)
);

create index reports_reported_by_idx on public.reports (reported_by);
create index reports_resolved_by_idx on public.reports (resolved_by);
