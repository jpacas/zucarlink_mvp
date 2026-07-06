-- Corridas adicionales de precios en días de mercado (lun-vie): apertura y
-- mediodía, además del cron de cierre ya existente (`daily-market-update`,
-- 23:30 UTC, definido en 20260703_000030_daily_market_update.sql).
--
-- Mismo patrón de invocación que el cron de cierre: body vacío (sin `label`
-- ni `forceSummary`), por lo que estas corridas nunca disparan el resumen de
-- mercado con IA (ver supabase/functions/daily-market-update/index.ts) —
-- solo actualizan `price_items`. El upsert por (label, observed_at) hace que
-- cada corrida del mismo día simplemente actualice la fila existente.

-- Apertura: 05:00 hora El Salvador (UTC-6) = 11:00 UTC.
select cron.schedule(
  'daily-market-update-open',
  '0 11 * * 1-5',
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

-- Mediodía: 11:30 hora El Salvador (UTC-6) = 17:30 UTC.
select cron.schedule(
  'daily-market-update-midday',
  '30 17 * * 1-5',
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
