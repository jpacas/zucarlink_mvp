-- Permite que visitantes no autenticados envíen una solicitud de contacto (lead) a un proveedor.
-- Antes, el RPC create_provider_lead exigía sesión (auth.uid() no nulo) y requester_id era
-- obligatorio. Ahora un lead anónimo guarda requester_id = null. Se añade validación defensiva
-- en el RPC porque pasa a ser invocable por el rol anon.

alter table public.provider_leads
  alter column requester_id drop not null;

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
  if coalesce(btrim(name_text), '') = ''
     or coalesce(btrim(email_text), '') = ''
     or coalesce(btrim(message_text), '') = '' then
    raise exception 'Nombre, email y mensaje son obligatorios';
  end if;

  if not exists (
    select 1
    from public.providers
    where id = provider_id
      and status = 'active'
  ) then
    raise exception 'Proveedor no disponible';
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
    btrim(name_text),
    btrim(email_text),
    nullif(btrim(company_text), ''),
    btrim(message_text),
    'new'
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.create_provider_lead(uuid, text, text, text, text) to anon, authenticated;
