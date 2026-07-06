-- El cron diario ('daily-market-update', lun-vie) ya no dispara el resumen de
-- mercado sin un label explícito (evita meter dos llamadas a Anthropic con
-- web_search en el mismo request, que se acerca al límite de idle timeout de
-- 150s de la Edge Function). En su lugar, cada serie tiene su propio cron
-- semanal que pasa su label en el body — una sola llamada a Anthropic por
-- invocación.
select cron.schedule(
  'weekly-market-summary-crudo',
  '35 23 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/daily-market-update',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'prices_cron_secret')
    ),
    body := jsonb_build_object('label', 'Azúcar crudo NY No.11'),
    timeout_milliseconds := 120000
  );
  $$
);

select cron.schedule(
  'weekly-market-summary-refinada',
  '40 23 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/daily-market-update',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'prices_cron_secret')
    ),
    body := jsonb_build_object('label', 'Azúcar refinada'),
    timeout_milliseconds := 120000
  );
  $$
);
