-- Public profile preview: returns a curated subset of complete, verified-or-not profiles
-- for display on the public directory page. No contact information exposed.
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
  order by
    (p.verification_status = 'verified') desc,
    p.updated_at desc nulls last
  limit least(limit_count, 24);
$$;

revoke all on function public.list_public_preview_profiles(integer) from public;
grant execute on function public.list_public_preview_profiles(integer) to anon, authenticated;
