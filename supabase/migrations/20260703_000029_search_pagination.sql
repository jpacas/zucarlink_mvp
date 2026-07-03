-- Arregla las búsquedas de directorio y proveedores para que no traigan la tabla
-- completa: LIMIT/OFFSET en las RPC + pg_trgm para acelerar los ILIKE, y un índice
-- compuesto para el filtro que usan casi todas las consultas del directorio.

create extension if not exists pg_trgm;

create index if not exists profiles_account_type_profile_status_idx
  on public.profiles (account_type, profile_status);

create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);

create index if not exists companies_name_trgm_idx
  on public.companies using gin (name gin_trgm_ops);

create index if not exists providers_company_name_trgm_idx
  on public.providers using gin (company_name gin_trgm_ops);

create index if not exists providers_short_description_trgm_idx
  on public.providers using gin (short_description gin_trgm_ops);

-- ─── search_directory_profiles ──────────────────────────────────────────────
-- Se agregan limit_count/offset_count (con default, agrega parámetros al final
-- para no romper la firma existente). El match de texto se separa por columna
-- (antes era un solo LIKE sobre una concatenación) para poder usar los índices
-- trigram de full_name/companies.name.
create or replace function public.search_directory_profiles(
  search_text text default null,
  country_filter text default null,
  specialty_slug_filter text default null,
  limit_count integer default 30,
  offset_count integer default 0
)
returns table (
  id uuid,
  full_name text,
  role_title text,
  organization_name text,
  country text,
  short_bio text,
  avatar_path text,
  specialties text[],
  verification_status text
)
language sql
security definer
set search_path = public
as $$
  with visible_profiles as (
    select
      profiles.id,
      profiles.full_name,
      profiles.role_title,
      profiles.country,
      profiles.short_bio,
      profiles.avatar_path,
      profiles.verification_status,
      companies.name as organization_name
    from public.profiles
    left join public.companies on companies.id = profiles.current_company_id
    where profiles.account_type = 'technician'
      and profiles.profile_status = 'complete'
  ),
  profile_specialty_names as (
    select
      profile_specialties.profile_id,
      array_agg(specialties.name order by specialties.name) as specialties,
      string_agg(lower(specialties.slug), ' ') as specialty_slugs,
      string_agg(lower(specialties.name), ' ') as specialty_names
    from public.profile_specialties
    join public.specialties on specialties.id = profile_specialties.specialty_id
    group by profile_specialties.profile_id
  )
  select
    visible_profiles.id,
    visible_profiles.full_name,
    visible_profiles.role_title,
    visible_profiles.organization_name,
    visible_profiles.country,
    visible_profiles.short_bio,
    visible_profiles.avatar_path,
    coalesce(profile_specialty_names.specialties, '{}') as specialties,
    visible_profiles.verification_status
  from visible_profiles
  left join profile_specialty_names on profile_specialty_names.profile_id = visible_profiles.id
  where (
    nullif(trim(search_text), '') is null
    or visible_profiles.full_name ilike '%' || trim(search_text) || '%'
    or coalesce(visible_profiles.organization_name, '') ilike '%' || trim(search_text) || '%'
    or coalesce(profile_specialty_names.specialty_names, '') ilike '%' || trim(search_text) || '%'
  )
    and (
      nullif(trim(country_filter), '') is null
      or lower(coalesce(visible_profiles.country, '')) = lower(trim(country_filter))
    )
    and (
      nullif(trim(specialty_slug_filter), '') is null
      or coalesce(profile_specialty_names.specialty_slugs, '') like '%' || lower(trim(specialty_slug_filter)) || '%'
    )
  order by
    case visible_profiles.verification_status
      when 'verified' then 0
      when 'pending' then 1
      else 2
    end,
    visible_profiles.full_name asc
  limit least(greatest(limit_count, 1), 200)
  offset greatest(offset_count, 0);
$$;

-- ─── search_providers ───────────────────────────────────────────────────────
create or replace function public.search_providers(
  search_text text default null,
  category_slug text default null,
  country_filter text default null,
  limit_count integer default 30,
  offset_count integer default 0
)
returns table (
  id uuid,
  slug text,
  company_name text,
  logo_url text,
  short_description text,
  countries text[],
  brands text[],
  is_verified boolean,
  category jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    providers.id,
    providers.slug,
    providers.company_name,
    providers.logo_url,
    providers.short_description,
    providers.countries,
    providers.brands,
    providers.is_verified,
    jsonb_build_object(
      'id', provider_categories.id,
      'slug', provider_categories.slug,
      'name', provider_categories.name
    ) as category
  from public.providers
  left join public.provider_categories
    on provider_categories.id = providers.category_id
  where providers.status = 'active'
    and (
      search_text is null
      or providers.company_name ilike '%' || search_text || '%'
      or coalesce(providers.short_description, '') ilike '%' || search_text || '%'
      or array_to_string(providers.brands, ' ') ilike '%' || search_text || '%'
      or array_to_string(providers.products_services, ' ') ilike '%' || search_text || '%'
    )
    and (
      category_slug is null
      or provider_categories.slug = category_slug
    )
    and (
      country_filter is null
      or country_filter = any (providers.countries)
    )
  order by providers.is_verified desc, providers.company_name asc
  limit least(greatest(limit_count, 1), 200)
  offset greatest(offset_count, 0);
$$;

revoke all on function public.search_directory_profiles(text, text, text, integer, integer) from public;
grant execute on function public.search_directory_profiles(text, text, text, integer, integer) to authenticated;

revoke all on function public.search_providers(text, text, text, integer, integer) from public;
grant execute on function public.search_providers(text, text, text, integer, integer) to anon, authenticated;
