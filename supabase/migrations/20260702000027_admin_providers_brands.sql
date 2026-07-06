-- Fix: list_providers_admin() no devolvía la columna brands, dejando el
-- panel de admin siempre con brands vacío para todos los proveedores.
--
-- Se agrega brands en medio del returns table (entre countries e is_verified,
-- igual que search_providers/get_provider_by_slug), lo cual cambia la posición
-- de columnas de salida. Postgres no permite eso con CREATE OR REPLACE FUNCTION
-- (solo permite agregar columnas al final), así que hay que dropear primero,
-- igual que se hizo en 20260627_000025_provider_brands.sql para las otras
-- funciones de proveedores.
drop function if exists public.list_providers_admin();

create function public.list_providers_admin()
returns table (
  id uuid,
  slug text,
  company_name text,
  logo_url text,
  short_description text,
  countries text[],
  brands text[],
  is_verified boolean,
  status text,
  category jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
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
    providers.brands,
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

-- El DROP FUNCTION elimina los grants existentes sobre la función; se restaura
-- el mismo grant explícito que se otorgó originalmente en
-- 20260418_000010_providers_admin_week9.sql.
grant execute on function public.list_providers_admin() to authenticated;
