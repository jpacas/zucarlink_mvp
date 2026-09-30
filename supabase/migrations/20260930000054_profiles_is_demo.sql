-- T10: marcar perfiles demo (scripts/seed-week5-demo-profiles.mjs) para
-- excluirlos de las superficies públicas y de las estadísticas agregadas del
-- directorio. Antes eran indistinguibles de perfiles reales — cualquier
-- visitante o cliente potencial podía terminar viendo "Ana Lucía Mejía" como
-- si fuera un técnico real de la red.
--
-- No se infiere por email @zucarlink.test (frágil: un usuario real podría
-- coincidir con el dominio de prueba en otro entorno, y el filtro se rompería
-- silenciosamente si el dominio de seed cambia). Columna explícita en su lugar.

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

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
    and profiles.public_listing_opt_out = false
    and profiles.is_demo = false;
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
    and p.is_demo = false
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
      and profiles.is_demo = false
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

-- ─── search_directory_profiles ──────────────────────────────────────────────
-- A diferencia de public_listing_opt_out, is_demo SÍ se filtra acá: los
-- perfiles demo tampoco deben aparecer para técnicos reales navegando el
-- directorio interno — no son pares reales con quien conectar.
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
      and profiles.is_demo = false
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

revoke all on function public.search_directory_profiles(text, text, text, integer, integer) from public;
grant execute on function public.search_directory_profiles(text, text, text, integer, integer) to authenticated;

notify pgrst, 'reload schema';
