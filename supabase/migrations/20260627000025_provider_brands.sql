-- Agrega la lista de marcas que ofrece cada proveedor (fabricadas o representadas).
-- No distinguimos fabricante vs. representante: el técnico busca la solución, no el tipo
-- de interlocutor. La columna es buscable para encontrar al proveedor por marca.

alter table public.providers
  add column if not exists brands text[] not null default '{}';

-- Recrear search_providers: cambia la firma del returns table (se agrega brands),
-- por lo que hay que dropear antes de recrear.
drop function if exists public.search_providers(text, text, text);

create function public.search_providers(
  search_text text default null,
  category_slug text default null,
  country_filter text default null
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
  order by providers.is_verified desc, providers.company_name asc;
$$;

-- Recrear get_provider_by_slug con brands en el returns table.
drop function if exists public.get_provider_by_slug(text);

create function public.get_provider_by_slug(provider_slug text)
returns table (
  id uuid,
  slug text,
  company_name text,
  logo_url text,
  short_description text,
  long_description text,
  countries text[],
  products_services text[],
  brands text[],
  website text,
  contact_email text,
  is_verified boolean,
  status text,
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
    providers.long_description,
    providers.countries,
    providers.products_services,
    providers.brands,
    providers.website,
    providers.contact_email,
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
  where providers.slug = provider_slug
    and (providers.status = 'active' or providers.owner_id = auth.uid())
  limit 1;
$$;

grant execute on function public.search_providers(text, text, text) to anon, authenticated;
grant execute on function public.get_provider_by_slug(text) to anon, authenticated;
