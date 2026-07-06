-- Cuando web_search agotó su cuota, el generador guardó el mensaje de
-- disculpa del modelo como resumen semanal. Se eliminan esas filas; la
-- próxima corrida del cron regenera la semana afectada. La edge function
-- ahora rechaza resúmenes >800 caracteres o con meta-conversación.
delete from public.price_market_summaries
where length(summary) > 800
   or summary ~* 'l[ií]mite de b[uú]squedas|l[ií]mite del uso|herramienta de b[uú]squeda|reintentar la b[uú]squeda|env[ií]eme un nuevo mensaje';
