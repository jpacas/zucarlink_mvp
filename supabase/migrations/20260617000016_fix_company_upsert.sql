-- Fix: la migración 20260516_000015 fallaba en `ADD CONSTRAINT IF NOT EXISTS`
-- (sintaxis no válida en PostgreSQL). El rollback dejó sin crear el constraint
-- companies_name_unique, la función upsert_company y replace_profile_specialties.
-- Esta migración recrea esos objetos de forma idempotente.

-- Constraint único en companies.name (guardado, sintaxis válida).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_name_unique'
  ) then
    alter table public.companies
      add constraint companies_name_unique unique (name);
  end if;
end$$;

-- Upsert atómico de empresa: inserta o devuelve el id existente.
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
  on conflict (name) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.companies where name = p_name;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_company(text, text) to authenticated;

-- Reemplazo atómico de especialidades del perfil.
create or replace function public.replace_profile_specialties(
  p_user_id uuid,
  p_specialty_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> p_user_id then
    raise exception 'No autorizado';
  end if;

  delete from public.profile_specialties
  where profile_id = p_user_id;

  if p_specialty_ids is not null and array_length(p_specialty_ids, 1) > 0 then
    insert into public.profile_specialties (profile_id, specialty_id)
    select p_user_id, unnest(p_specialty_ids);
  end if;
end;
$$;

grant execute on function public.replace_profile_specialties(uuid, uuid[]) to authenticated;

-- Forzar recarga del cache de esquema de PostgREST.
notify pgrst, 'reload schema';
