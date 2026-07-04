-- Historial de resúmenes semanales de "qué movió el precio", uno por serie de
-- precio (label) y semana. Reemplaza el enfoque anterior de un solo resumen
-- sobreescrito en price_items.market_summary: ahora se acumula una entrada
-- nueva por semana y la UI la muestra como una lista bajo el gráfico.
create table if not exists public.price_market_summaries (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  period_start date not null,
  period_end date not null,
  summary text not null,
  sources jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Idempotencia: una entrada por serie y semana (permite upsert seguro si el
-- cron corre más de una vez en la misma semana).
create unique index if not exists price_market_summaries_label_period_key
  on public.price_market_summaries (label, period_start);

create index if not exists price_market_summaries_label_period_start_idx
  on public.price_market_summaries (label, period_start desc);

alter table public.price_market_summaries enable row level security;

-- Contenido generado automáticamente, sin flujo editorial de borrador —
-- lectura pública igual que el resto del contenido de mercado.
drop policy if exists price_market_summaries_public_read on public.price_market_summaries;
create policy price_market_summaries_public_read
on public.price_market_summaries
for select
using (true);
