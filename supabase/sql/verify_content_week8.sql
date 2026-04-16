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
