-- T12: toggle de "listado público" — un técnico puede optar por no aparecer
-- en las superficies visibles a internet/anónimos (directorio público,
-- ficha pública individual, sitemap), sin afectar su visibilidad dentro de
-- la red de pares ya autenticados (search_directory_profiles NO se filtra
-- acá a propósito: ese es el directorio interno para técnicos logueados).
--
-- Se aplica en el RPC, no solo en el sitemap (hallazgo de Codex en el eng
-- review): filtrar únicamente el sitemap dejaría la ficha pública accesible
-- por URL directa y el listado/summary público sin actualizar.

alter table public.profiles
  add column if not exists public_listing_opt_out boolean not null default false;

-- ─── get_public_member_profile ──────────────────────────────────────────────
create or replace function public.get_public_member_profile(profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_path text,
  role_title text,
  organization_name text,
  country text,
  short_bio text,
  specialties text[],
  verification_status text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_path,
    profiles.role_title,
    coalesce(companies.name, '') as organization_name,
    coalesce(profiles.country, '') as country,
    coalesce(profiles.short_bio, '') as short_bio,
    coalesce(
      (
        select array_agg(sp.name order by sp.name)
        from public.profile_specialties ps
        join public.specialties sp on sp.id = ps.specialty_id
        where ps.profile_id = profiles.id
      ),
      '{}'::text[]
    ) as specialties,
    profiles.verification_status
  from public.profiles
  left join public.companies on companies.id = profiles.current_company_id
  where profiles.id = profile_id
    and profiles.account_type = 'technician'
    and profiles.profile_status = 'complete'
    and profiles.public_listing_opt_out = false;
$$;

revoke all on function public.get_public_member_profile(uuid) from public;
grant execute on function public.get_public_member_profile(uuid) to anon, authenticated;

-- ─── list_public_preview_profiles ───────────────────────────────────────────
create or replace function public.list_public_preview_profiles(limit_count integer default 12)
returns table (
  id                uuid,
  full_name         text,
  avatar_path       text,
  role_title        text,
  organization_name text,
  country           text,
  specialties       text[],
  is_verified       boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.avatar_path,
    coalesce(p.role_title, '')         as role_title,
    coalesce(c.name, '')               as organization_name,
    coalesce(p.country, '')            as country,
    coalesce(
      (
        select array_agg(sp.name order by sp.name)
        from public.profile_specialties ps
        join public.specialties sp on sp.id = ps.specialty_id
        where ps.profile_id = p.id
        limit 3
      ),
      '{}'::text[]
    ) as specialties,
    (p.verification_status = 'verified') as is_verified
  from public.profiles p
  left join public.companies c on c.id = p.current_company_id
  where p.profile_status = 'complete'
    and p.account_type = 'technician'
    and p.public_listing_opt_out = false
  order by
    (p.verification_status = 'verified') desc,
    p.updated_at desc nulls last
  limit least(limit_count, 24);
$$;

revoke all on function public.list_public_preview_profiles(integer) from public;
grant execute on function public.list_public_preview_profiles(integer) to anon, authenticated;

-- ─── get_public_directory_summary ───────────────────────────────────────────
create or replace function public.get_public_directory_summary()
returns table (
  total_members bigint,
  total_countries bigint,
  total_companies bigint,
  total_specialties bigint
)
language sql
security definer
set search_path = public
as $$
  with visible_profiles as (
    select
      profiles.id,
      profiles.country,
      profiles.current_company_id
    from public.profiles
    where profiles.account_type = 'technician'
      and profiles.profile_status = 'complete'
      and profiles.public_listing_opt_out = false
  )
  select
    count(*)::bigint as total_members,
    count(distinct nullif(trim(country), ''))::bigint as total_countries,
    count(distinct current_company_id)::bigint as total_companies,
    (
      select count(distinct profile_specialties.specialty_id)::bigint
      from public.profile_specialties
      join visible_profiles on visible_profiles.id = profile_specialties.profile_id
    ) as total_specialties
  from visible_profiles;
$$;

revoke all on function public.get_public_directory_summary() from public;
grant execute on function public.get_public_directory_summary() to anon, authenticated;

notify pgrst, 'reload schema';
