alter table public.market_update_runs
  add column if not exists refined jsonb;
