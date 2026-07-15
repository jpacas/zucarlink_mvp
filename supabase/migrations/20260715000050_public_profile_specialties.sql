-- Enriquece el perfil público de miembro con especialidades técnicas.
-- Antes `get_public_member_profile` sólo devolvía identidad + bio, dejando la
-- ficha pública (indexable) casi vacía. Añadimos `specialties text[]` reusando
-- el patrón array_agg de `list_public_preview_profiles`. La experiencia sigue
-- detrás del gate de registro; aquí sólo exponemos especialidades + verificación.

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
    and profiles.profile_status = 'complete';
$$;

revoke all on function public.get_public_member_profile(uuid) from public;
grant execute on function public.get_public_member_profile(uuid) to anon, authenticated;
