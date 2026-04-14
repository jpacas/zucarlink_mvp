select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'specialties',
    'profile_specialties',
    'companies',
    'experiences',
    'conversations',
    'messages',
    'forum_categories',
    'forum_topics',
    'forum_replies',
    'providers',
    'provider_leads'
  )
order by table_name;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'avatars';
