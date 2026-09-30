-- T11: create_provider_lead es invocable por anon (20260623000020) sin ningún
-- límite ni validación de formato de email. Un script puede reventar el buzón
-- de un proveedor con cientos de leads falsos en segundos. Se suma:
--   1. Validación de formato de email (defensiva, no exhaustiva).
--   2. Rate limit atómico: máx 5 leads por email por ventana de 1 hora,
--      usando el patrón INSERT ... ON CONFLICT DO UPDATE ... WHERE count<limit
--      RETURNING — el UPDATE solo aplica si count sigue bajo el límite, así
--      que dos requests concurrentes no pueden ambos "colarse" pasando el tope
--      (el UPDATE serializa por el lock de fila del INSERT/ON CONFLICT).
--
-- Se limita por email (no por IP): PostgREST/Supabase corre detrás de un
-- pooler, así que inet_client_addr() en el RPC no refleja la IP real del
-- visitante — el email que el propio visitante escribe es la única señal de
-- "origen" disponible dentro del RPC.

create table if not exists public.provider_lead_rate_limits (
  rate_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (rate_key, window_start)
);

-- Sin RLS: solo la accede el RPC security definer de abajo.
alter table public.provider_lead_rate_limits enable row level security;

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
  v_email text;
  v_rate_key text;
  v_window_start timestamptz;
  v_count integer;
  v_limit constant integer := 5;
begin
  if coalesce(btrim(name_text), '') = ''
     or coalesce(btrim(email_text), '') = ''
     or coalesce(btrim(message_text), '') = '' then
    raise exception 'Nombre, email y mensaje son obligatorios';
  end if;

  v_email := lower(btrim(email_text));

  if v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'El email no tiene un formato válido';
  end if;

  if not exists (
    select 1
    from public.providers
    where id = provider_id
      and status = 'active'
  ) then
    raise exception 'Proveedor no disponible';
  end if;

  v_rate_key := 'provider_lead:' || v_email;
  v_window_start := date_trunc('hour', now());

  insert into public.provider_lead_rate_limits (rate_key, window_start, count)
  values (v_rate_key, v_window_start, 1)
  on conflict (rate_key, window_start) do update
    set count = provider_lead_rate_limits.count + 1
    where provider_lead_rate_limits.count < v_limit
  returning count into v_count;

  if v_count is null then
    raise exception 'Demasiadas solicitudes desde este email. Intenta de nuevo más tarde.';
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
    v_email,
    nullif(btrim(company_text), ''),
    btrim(message_text),
    'new'
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.create_provider_lead(uuid, text, text, text, text) to anon, authenticated;

-- Limpieza diaria de buckets viejos (evita crecimiento indefinido de la tabla).
select cron.schedule(
  'provider-lead-rate-limits-cleanup',
  '0 3 * * *',
  $$delete from public.provider_lead_rate_limits where window_start < now() - interval '2 days'$$
);

notify pgrst, 'reload schema';
