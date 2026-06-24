alter table public.price_items
  add column if not exists value_numeric numeric,
  add column if not exists featured boolean not null default false,
  add column if not exists market_summary text,
  add column if not exists market_summary_sources jsonb,
  add column if not exists market_summary_updated_at timestamptz;
