-- Fix 1: Atomic specialty replacement
-- Replaces the two-step delete+insert from the client with a single transaction.
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


-- Fix 2: Atomic company upsert + unique constraint on companies.name
-- Step 1: deduplicate companies (keep oldest per name, reroute FK references).
do $$
declare
  dup record;
  canonical_id uuid;
begin
  for dup in
    select name
    from public.companies
    group by name
    having count(*) > 1
  loop
    select id into canonical_id
    from public.companies
    where name = dup.name
    order by created_at asc
    limit 1;

    update public.profiles
    set current_company_id = canonical_id
    where current_company_id in (
      select id from public.companies
      where name = dup.name and id <> canonical_id
    );

    update public.experiences
    set company_id = canonical_id
    where company_id in (
      select id from public.companies
      where name = dup.name and id <> canonical_id
    );

    delete from public.companies
    where name = dup.name and id <> canonical_id;
  end loop;
end;
$$;

-- Step 2: add unique constraint so the upsert_company function can rely on ON CONFLICT.
alter table public.companies
  add constraint if not exists companies_name_unique unique (name);

-- Step 3: atomic upsert function — inserts or returns existing company id.
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
    select id into v_id
    from public.companies
    where name = p_name;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_company(text, text) to authenticated;
