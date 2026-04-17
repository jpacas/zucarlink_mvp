select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('content_items', 'events', 'price_items')
order by table_name;

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('content_items', 'events', 'price_items')
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('content_items', 'events', 'price_items')
order by tablename, policyname;

select
  (select count(*) from public.content_items where status = 'published') as published_content_items,
  (select count(*) from public.events where status = 'published') as published_events,
  (select count(*) from public.price_items where status = 'published') as published_price_items,
  (
    (select count(*) from public.content_items where status = 'published')
    + (select count(*) from public.events where status = 'published')
    + (select count(*) from public.price_items where status = 'published')
  ) as published_total;

select
  type,
  count(*) as published_count
from public.content_items
where status = 'published'
group by type
order by type;

select
  count(*) as featured_published_content
from public.content_items
where status = 'published'
  and is_featured = true;

select
  count(*) as placeholder_urls_in_published_content
from (
  select source_url
  from public.content_items
  where status = 'published'
  union all
  select source_url
  from public.events
  where status = 'published'
  union all
  select source_url
  from public.price_items
  where status = 'published'
) as published_sources
where source_url ilike '%example.com%'
   or source_url ilike '%zucarlink.example%';
