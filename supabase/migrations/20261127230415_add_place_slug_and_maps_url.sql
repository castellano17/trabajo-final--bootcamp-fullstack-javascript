create extension if not exists unaccent with schema extensions;

create function private.slugify(value text)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(
      trim(both '-' from left(
        trim(both '-' from regexp_replace(
          lower(extensions.unaccent('extensions.unaccent'::regdictionary, value)),
          '[^a-z0-9]+',
          '-',
          'g'
        )),
        60
      )),
      ''
    ),
    'lugar'
  );
$$;

create function private.unique_place_slug(place_name text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  base_slug text := private.slugify(place_name);
  candidate text := base_slug;
  suffix integer := 1;
begin
  while candidate = 'nuevo'
    or candidate ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or exists (select 1 from public.places where places.slug = candidate)
  loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  return candidate;
end;
$$;

alter table public.places
  add column slug text,
  add column maps_url text;

do $$
declare
  place record;
begin
  for place in select id, name from public.places order by created_at, id loop
    update public.places
    set slug = private.unique_place_slug(place.name)
    where id = place.id;
  end loop;
end;
$$;

alter table public.places
  alter column slug set not null,
  alter column slug set default '',
  add constraint places_slug_key unique (slug),
  add constraint places_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(slug) between 1 and 64
    and slug <> 'nuevo'
  ),
  add constraint places_maps_url_format check (
    char_length(maps_url) <= 500
    and maps_url ~ '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.)?google\.com/maps|maps\.google\.com/)'
  );

create function private.set_place_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.slug := private.unique_place_slug(new.name);
  return new;
end;
$$;

create trigger set_place_slug
  before insert on public.places
  for each row execute function private.set_place_slug();

grant insert (maps_url) on public.places to authenticated;
grant update (maps_url) on public.places to authenticated;
