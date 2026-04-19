create or replace function public.list_providers_admin()
returns table (
  id uuid,
  slug text,
  company_name text,
  logo_url text,
  short_description text,
  countries text[],
  is_verified boolean,
  status text,
  category jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() -> 'user_metadata' ->> 'is_admin', 'false') <> 'true' then
    raise exception 'Permisos insuficientes';
  end if;

  return query
  select
    providers.id,
    providers.slug,
    providers.company_name,
    providers.logo_url,
    providers.short_description,
    providers.countries,
    providers.is_verified,
    providers.status,
    jsonb_build_object(
      'id', provider_categories.id,
      'slug', provider_categories.slug,
      'name', provider_categories.name
    ) as category
  from public.providers
  left join public.provider_categories
    on provider_categories.id = providers.category_id
  order by providers.updated_at desc, providers.company_name asc;
end;
$$;

create or replace function public.admin_update_provider_status(
  provider_id uuid,
  next_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  if coalesce(auth.jwt() -> 'user_metadata' ->> 'is_admin', 'false') <> 'true' then
    raise exception 'Permisos insuficientes';
  end if;

  if next_status not in ('lead', 'draft_profile', 'active', 'inactive') then
    raise exception 'Estado inválido';
  end if;

  update public.providers
  set status = next_status
  where providers.id = provider_id
  returning providers.id into updated_id;

  if updated_id is null then
    raise exception 'Proveedor no encontrado';
  end if;

  return updated_id;
end;
$$;

grant execute on function public.list_providers_admin() to authenticated;
grant execute on function public.admin_update_provider_status(uuid, text) to authenticated;
