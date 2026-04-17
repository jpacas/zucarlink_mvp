create table if not exists public.provider_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.provider_categories enable row level security;

drop policy if exists provider_categories_public_read on public.provider_categories;
create policy provider_categories_public_read
on public.provider_categories
for select
using (true);

alter table public.providers
  add column if not exists slug text,
  add column if not exists logo_url text,
  add column if not exists short_description text,
  add column if not exists long_description text,
  add column if not exists category_id uuid references public.provider_categories (id) on delete set null,
  add column if not exists countries text[] not null default '{}',
  add column if not exists products_services text[] not null default '{}',
  add column if not exists website text,
  add column if not exists contact_email text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists status text not null default 'draft_profile';

update public.providers
set short_description = coalesce(short_description, description)
where short_description is null;

update public.providers
set slug = regexp_replace(lower(trim(company_name)), '[^a-z0-9]+', '-', 'g')
where slug is null or slug = '';

alter table public.providers
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_status_check'
  ) then
    alter table public.providers
      add constraint providers_status_check
      check (status in ('lead', 'draft_profile', 'active', 'inactive'));
  end if;
end $$;

create unique index if not exists providers_slug_idx
  on public.providers (slug);

create index if not exists providers_status_idx
  on public.providers (status);

create index if not exists providers_category_id_idx
  on public.providers (category_id);

alter table public.provider_leads
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists status text not null default 'new';

update public.provider_leads
set
  name = coalesce(name, 'Lead Zucarlink'),
  email = coalesce(email, ''),
  company = company,
  status = coalesce(status, 'new')
where name is null or email is null;

alter table public.provider_leads
  alter column name set not null,
  alter column email set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_leads_status_check'
  ) then
    alter table public.provider_leads
      add constraint provider_leads_status_check
      check (status in ('new', 'reviewed', 'contacted', 'closed'));
  end if;
end $$;

drop policy if exists providers_public_read on public.providers;
create policy providers_public_read
on public.providers
for select
using (status = 'active' or auth.uid() = owner_id);

create or replace function public.list_provider_categories()
returns table (
  id uuid,
  slug text,
  name text
)
language sql
security definer
set search_path = public
as $$
  select provider_categories.id, provider_categories.slug, provider_categories.name
  from public.provider_categories
  order by provider_categories.name asc;
$$;

create or replace function public.search_providers(
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

create or replace function public.get_provider_by_slug(provider_slug text)
returns table (
  id uuid,
  slug text,
  company_name text,
  logo_url text,
  short_description text,
  long_description text,
  countries text[],
  products_services text[],
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

create or replace function public.create_provider_lead(
  provider_id uuid,
  name_text text,
  email_text text,
  company_text text default null,
  message_text text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Auth requerida para crear leads';
  end if;

  insert into public.provider_leads (
    provider_id,
    requester_id,
    name,
    email,
    company,
    message,
    status
  )
  values (
    provider_id,
    auth.uid(),
    trim(name_text),
    trim(email_text),
    nullif(trim(company_text), ''),
    trim(message_text),
    'new'
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.list_provider_categories() to anon, authenticated;
grant execute on function public.search_providers(text, text, text) to anon, authenticated;
grant execute on function public.get_provider_by_slug(text) to anon, authenticated;
grant execute on function public.create_provider_lead(uuid, text, text, text, text) to authenticated;
