-- Normaliza la unicidad de companies.name para evitar duplicados que solo difieren
-- en mayúsculas, acentos o espacios (p. ej. "Ingenio La Cabaña" vs "ingenio la cabana").
-- Sustituye el constraint plano companies_name_unique por un índice único sobre una
-- forma normalizada del nombre, y ajusta upsert_company para usar esa normalización.

-- Extensión para quitar acentos/diacríticos (en Supabase vive en el esquema `extensions`).
create extension if not exists unaccent with schema extensions;

-- Forma canónica de un nombre de empresa: sin acentos, sin espacios redundantes,
-- en minúsculas. IMMUTABLE para poder usarse en un índice de expresión.
create or replace function public.normalize_company_name(p_name text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, public
as $$
  select lower(trim(regexp_replace(unaccent(coalesce(p_name, '')), '\s+', ' ', 'g')));
$$;

-- Deduplicar empresas existentes por nombre normalizado: conservar la más antigua
-- por grupo y redirigir las referencias (profiles.current_company_id, experiences.company_id).
do $$
declare
  dup record;
  canonical_id uuid;
begin
  for dup in
    select public.normalize_company_name(name) as norm
    from public.companies
    group by public.normalize_company_name(name)
    having count(*) > 1
  loop
    select id into canonical_id
    from public.companies
    where public.normalize_company_name(name) = dup.norm
    order by created_at asc
    limit 1;

    update public.profiles
    set current_company_id = canonical_id
    where current_company_id in (
      select id from public.companies
      where public.normalize_company_name(name) = dup.norm and id <> canonical_id
    );

    update public.experiences
    set company_id = canonical_id
    where company_id in (
      select id from public.companies
      where public.normalize_company_name(name) = dup.norm and id <> canonical_id
    );

    delete from public.companies
    where public.normalize_company_name(name) = dup.norm and id <> canonical_id;
  end loop;
end$$;

-- El índice normalizado reemplaza al constraint plano (más estricto: implica unicidad exacta).
alter table public.companies drop constraint if exists companies_name_unique;

create unique index if not exists companies_name_normalized_key
  on public.companies (public.normalize_company_name(name));

-- upsert_company ahora resuelve conflictos sobre el nombre normalizado.
create or replace function public.upsert_company(
  p_name text,
  p_country text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.companies (name, country)
  values (p_name, p_country)
  on conflict (public.normalize_company_name(name)) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.companies
    where public.normalize_company_name(name) = public.normalize_company_name(p_name)
    limit 1;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_company(text, text) to authenticated;

-- Forzar recarga del cache de esquema de PostgREST.
notify pgrst, 'reload schema';
