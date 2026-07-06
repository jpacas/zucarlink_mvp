-- Alinea el universo de perfiles visibles entre las RPC públicas
-- (get_public_member_profile, list_public_preview_profiles) y la privada
-- (get_directory_profile_detail / search_directory_profiles), que ya exigen
-- account_type = 'technician' y profile_status = 'complete'. Sin este cambio,
-- un perfil listado en una vista puede no poder abrirse en la otra.

create or replace function public.get_public_member_profile(profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_path text,
  role_title text,
  organization_name text,
  country text,
  short_bio text,
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
    profiles.verification_status
  from public.profiles
  left join public.companies on companies.id = profiles.current_company_id
  where profiles.id = profile_id
    and profiles.account_type = 'technician'
    and profiles.profile_status = 'complete';
$$;

revoke all on function public.get_public_member_profile(uuid) from public;
grant execute on function public.get_public_member_profile(uuid) to anon, authenticated;

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
  order by
    (p.verification_status = 'verified') desc,
    p.updated_at desc nulls last
  limit least(limit_count, 24);
$$;

revoke all on function public.list_public_preview_profiles(integer) from public;
grant execute on function public.list_public_preview_profiles(integer) to anon, authenticated;

notify pgrst, 'reload schema';
