-- Revierte 20260707000041: la automatización de "Azúcar refinada" vía
-- scraping de Investing.com se abandonó (bloqueo 403 desde producción,
-- confirmado 2/2 intentos) a favor de un panel de carga manual.
alter table public.market_update_runs
  drop column if exists refined;
