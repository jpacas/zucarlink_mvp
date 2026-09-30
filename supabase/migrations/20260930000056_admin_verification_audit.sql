-- T9: reconstruye el flujo admin de verificación con auditoría.
-- admin_update_verification existía (20260423000013) pero: (a) solo permitía
-- transicionar perfiles en estado 'pending', así que nunca pudo revocar una
-- verificación ya otorgada; (b) no dejaba rastro de quién otorgó/revocó ni
-- cuándo; (c) no tenía UI — quedó como RPC muerto. Ningún flujo del producto
-- lleva un perfil a 'pending' todavía (no hay "solicitar verificación"
-- self-serve), así que esto habilita grant/revoke directo por admin sobre
-- cualquier perfil técnico, con log.

create table if not exists public.admin_verification_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references auth.users (id) on delete set null,
  previous_status text not null,
  new_status text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_verification_log_profile_idx
  on public.admin_verification_log (profile_id, created_at desc);

-- Sin políticas de RLS para anon/authenticated: solo lo escriben/leen los
-- RPC security definer de abajo, que ya exigen is_admin().
alter table public.admin_verification_log enable row level security;

create or replace function public.admin_update_verification(
  p_profile_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_status text;
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado.';
  end if;

  if p_new_status not in ('verified', 'unverified') then
    raise exception 'Estado de verificación no válido. Use "verified" o "unverified".';
  end if;

  select verification_status into v_previous_status
  from public.profiles
  where id = p_profile_id
    and account_type = 'technician'
  for update;

  if v_previous_status is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if v_previous_status = p_new_status then
    raise exception 'El perfil ya está en ese estado.';
  end if;

  update public.profiles
  set
    verification_status = p_new_status,
    updated_at = timezone('utc', now())
  where id = p_profile_id;

  insert into public.admin_verification_log (profile_id, admin_id, previous_status, new_status)
  values (p_profile_id, auth.uid(), v_previous_status, p_new_status);
end;
$$;

-- Búsqueda de perfiles técnicos para la vista admin de verificación (grant/revoke).
-- status_filter null = todos; si se pasa, filtra por ese estado exacto.
create or replace function public.admin_search_verifiable_profiles(
  search_text text default null,
  status_filter text default null,
  limit_count integer default 30
)
returns table (
  id                  uuid,
  full_name           text,
  country             text,
  organization_name   text,
  verification_status text,
  updated_at          timestamptz
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
    p.full_name,
    coalesce(p.country, '') as country,
    coalesce(c.name, '') as organization_name,
    p.verification_status,
    p.updated_at
  from public.profiles p
  left join public.companies c on c.id = p.current_company_id
  where p.account_type = 'technician'
    and (
      nullif(trim(search_text), '') is null
      or p.full_name ilike '%' || trim(search_text) || '%'
      or coalesce(c.name, '') ilike '%' || trim(search_text) || '%'
    )
    and (
      status_filter is null
      or p.verification_status = status_filter
    )
  order by
    case p.verification_status when 'pending' then 0 when 'verified' then 1 else 2 end,
    p.updated_at desc nulls last
  limit least(greatest(limit_count, 1), 100);
end;
$$;

create or replace function public.admin_list_verification_log(limit_count integer default 30)
returns table (
  id                uuid,
  profile_id        uuid,
  profile_full_name text,
  admin_email       text,
  previous_status   text,
  new_status        text,
  created_at        timestamptz
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
    l.id,
    l.profile_id,
    coalesce(p.full_name, '(perfil eliminado)') as profile_full_name,
    coalesce(u.email, '(admin desconocido)') as admin_email,
    l.previous_status,
    l.new_status,
    l.created_at
  from public.admin_verification_log l
  left join public.profiles p on p.id = l.profile_id
  left join auth.users u on u.id = l.admin_id
  order by l.created_at desc
  limit least(greatest(limit_count, 1), 100);
end;
$$;

revoke all on function public.admin_update_verification(uuid, text) from public;
revoke all on function public.admin_search_verifiable_profiles(text, text, integer) from public;
revoke all on function public.admin_list_verification_log(integer) from public;

grant execute on function public.admin_update_verification(uuid, text) to authenticated;
grant execute on function public.admin_search_verifiable_profiles(text, text, integer) to authenticated;
grant execute on function public.admin_list_verification_log(integer) to authenticated;

notify pgrst, 'reload schema';
