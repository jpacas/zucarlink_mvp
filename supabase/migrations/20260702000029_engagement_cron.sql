-- Programa la ejecución horaria de la edge function `engagement-emails`.
--
-- Requiere dos secrets en Supabase Vault, creados manualmente una única vez
-- desde el SQL Editor del dashboard (no se versionan en git):
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<ENGAGEMENT_CRON_SECRET value>', 'engagement_cron_secret');
--
-- El mismo valor de `engagement_cron_secret` debe configurarse como Supabase Secret
-- (`supabase secrets set ENGAGEMENT_CRON_SECRET=...`) para que la edge function lo valide.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'engagement-emails-hourly',
  '15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/engagement-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'engagement_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
