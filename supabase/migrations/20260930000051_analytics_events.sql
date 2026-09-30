-- Fase 0 del plan de crecimiento técnico (/plan-ceo-review, 2026-09-30): tabla
-- de eventos de producto para reemplazar trackEvent() (src/lib/analytics.ts),
-- que hoy dispara un CustomEvent de DOM sin ningún listener — cero medición
-- real de comportamiento desde que existe el MVP.
--
-- Alcance deliberadamente acotado a usuarios autenticados por ahora: user_id
-- toma auth.uid() por default y la política de INSERT exige que coincida, así
-- que un insert anónimo (auth.uid() is null) queda bloqueado por RLS sin
-- necesitar una excepción explícita. Capturar visitantes anónimos (ej. en
-- /directory o /forum público) es un paso deliberadamente diferido: requiere
-- el patrón RPC security definer + rate limiting documentado como T1b en el
-- plan (mismo patrón que create_provider_lead), no una política RLS directa
-- para anon.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_event_name_created_at_idx
  on public.analytics_events (event_name, created_at);

create index if not exists analytics_events_user_id_idx
  on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;

-- Solo usuarios autenticados pueden insertar, y solo a nombre de sí mismos
-- (user_id ya viene resuelto por el default auth.uid(), esto solo blinda
-- contra un intento de suplantar el user_id de otro usuario).
drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own
on public.analytics_events
for insert
to authenticated
with check (auth.uid() = user_id);

-- Sin política de SELECT para usuarios regulares: los eventos son de
-- escritura desde el cliente, no de lectura. Consultas de análisis (ej. el
-- umbral de activación de T3) se corren como service_role, que ignora RLS.
