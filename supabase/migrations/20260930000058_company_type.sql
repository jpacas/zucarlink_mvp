-- T17: columna company_type en companies (NO tabla ingenios nueva, decisión
-- del eng review: companies ya es la fuente única de verdad para el empleador
-- de un técnico, tanto en el perfil actual como en experiencias pasadas).
-- Nullable: las filas existentes quedan sin tipo — no hay forma honesta de
-- inferirlo retroactivamente por nombre, y un DO NOTHING en upsert_company
-- nunca las habría tipado de todos modos (hallazgo de la revisión adversarial).

alter table public.companies
  add column if not exists company_type text
  check (company_type in ('ingenio', 'otro'));

-- upsert_company gana un 3er parámetro opcional. PostgREST no resuelve bien
-- dos overloads del mismo nombre de función (riesgo real de PGRST203 "no se
-- pudo elegir la función candidata"), así que se dropea la firma de 2
-- argumentos en vez de dejarla coexistir con la nueva de 3. En conflicto,
-- solo rellena company_type si la fila existente todavía no tiene uno — nunca
-- sobreescribe un tipo ya asignado con el de una llamada posterior ambigua o
-- sin tipo.
drop function if exists public.upsert_company(text, text);

create function public.upsert_company(
  p_name text,
  p_country text default null,
  p_company_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_company_type is not null and p_company_type not in ('ingenio', 'otro') then
    raise exception 'Tipo de organización no válido.';
  end if;

  insert into public.companies (name, country, company_type)
  values (p_name, p_country, p_company_type)
  on conflict (public.normalize_company_name(name)) do update
    set company_type = coalesce(public.companies.company_type, excluded.company_type)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.upsert_company(text, text, text) to authenticated;

notify pgrst, 'reload schema';
