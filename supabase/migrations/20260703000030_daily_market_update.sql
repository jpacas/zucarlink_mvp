-- Actualización diaria automática de precios y resumen de mercado.
-- Programa la ejecución diaria (lun-vie) de la edge function `daily-market-update`,
-- que inserta el cierre del Azúcar crudo NY No.11 (ICE) en `price_items` y genera
-- el resumen de mercado con IA sobre la fila más reciente del indicador destacado.
--
-- Requiere un secret nuevo en Supabase Vault, creado manualmente una única vez
-- desde el SQL Editor del dashboard (no se versiona en git):
--
--   select vault.create_secret('<PRICES_CRON_SECRET value>', 'prices_cron_secret');
--
-- (`project_url` ya existe en Vault desde la migración de engagement.)
--
-- El mismo valor debe configurarse como Supabase Secret para que la edge function
-- lo valide, junto con la API key de Anthropic para el resumen IA:
--
--   supabase secrets set PRICES_CRON_SECRET=...
--   supabase secrets set ANTHROPIC_API_KEY=...
--
-- Las credenciales viven exclusivamente en Supabase Secrets y Vault; nunca en
-- código, migraciones ni documentación del repositorio.

-- Idempotencia: una fila por serie (label) y día. Es el requisito del upsert
-- `onConflict: 'label,observed_at'` de la edge function.
create unique index if not exists price_items_label_observed_at_key
  on public.price_items (label, observed_at);

-- Log de corridas del job (lectura/escritura solo con service role: RLS
-- habilitado sin policies públicas).
create table if not exists public.market_update_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default timezone('utc', now()),
  prices jsonb,
  summary jsonb
);

alter table public.market_update_runs enable row level security;

-- Retira el indicador sembrado manualmente: el valor 23.10 estaba etiquetado
-- como USD/lb pero el No.11 cotiza en centavos de USD por libra. La serie
-- automática lo reemplaza con la unidad correcta (¢ USD/lb).
update public.price_items
set status = 'draft'
where label = 'Azúcar crudo' and source_name = 'ICE';

-- Cron lun-vie 23:30 UTC, después de la liquidación de ICE Futures US (~13:00 ET).
select cron.schedule(
  'daily-market-update',
  '30 23 * * 1-5',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/daily-market-update',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'prices_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
