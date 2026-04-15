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
  table_name,
  column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'forum_categories' and column_name in ('sort_order', 'is_active'))
    or (table_name = 'forum_topics' and column_name in ('slug', 'status', 'reply_count', 'last_activity_at'))
    or (table_name = 'forum_replies' and column_name in ('parent_reply_id', 'status'))
  )
order by table_name, column_name;

select
  routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'list_forum_categories',
    'list_forum_threads',
    'get_forum_thread',
    'create_forum_topic',
    'create_forum_reply',
    'get_public_member_profile',
    'get_profile_forum_activity'
  )
order by routine_name;

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
