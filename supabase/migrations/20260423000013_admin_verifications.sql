-- Helper to check if the calling user has is_admin=true in their JWT metadata
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;

-- List profiles with verification_status = 'pending', ordered by most recently updated
create or replace function public.admin_list_pending_verifications()
returns table (
  id                  uuid,
  full_name           text,
  country             text,
  role_title          text,
  organization_name   text,
  short_bio           text,
  verification_status text,
  profile_status      text,
  account_type        text,
  created_at          timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado.';
  end if;

  return query
  select
    p.id,
    coalesce(p.full_name, '')                       as full_name,
    coalesce(p.country, '')                         as country,
    coalesce(p.role_title, '')                      as role_title,
    coalesce(c.name, p.company_name, '')            as organization_name,
    coalesce(p.short_bio, '')                       as short_bio,
    p.verification_status,
    p.profile_status,
    p.account_type,
    p.created_at
  from public.profiles p
  left join public.companies c on c.id = p.current_company_id
  where p.verification_status = 'pending'
  order by p.updated_at asc nulls last, p.created_at asc;
end;
$$;

-- Approve or reject a verification request
-- new_status must be 'verified' or 'unverified'
create or replace function public.admin_update_verification(
  p_profile_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado.';
  end if;

  if p_new_status not in ('verified', 'unverified') then
    raise exception 'Estado de verificación no válido. Use "verified" o "unverified".';
  end if;

  update public.profiles
  set
    verification_status = p_new_status,
    updated_at = timezone('utc', now())
  where id = p_profile_id
    and verification_status = 'pending';

  if not found then
    raise exception 'Perfil no encontrado o ya no está en estado pendiente.';
  end if;
end;
$$;

revoke all on function public.is_admin()                         from public;
revoke all on function public.admin_list_pending_verifications() from public;
revoke all on function public.admin_update_verification(uuid, text) from public;

grant execute on function public.is_admin()                         to authenticated;
grant execute on function public.admin_list_pending_verifications() to authenticated;
grant execute on function public.admin_update_verification(uuid, text) to authenticated;
