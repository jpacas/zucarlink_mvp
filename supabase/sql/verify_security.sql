-- 1. Confirmar que todos los usuarios autenticados tengan profile asociado.
select
  users.id as auth_user_id,
  profiles.id as profile_id,
  profiles.account_type,
  profiles.full_name
from auth.users as users
left join public.profiles on profiles.id = users.id
order by users.created_at desc;

-- 2. Confirmar que RLS está activado en tablas privadas clave.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_specialties',
    'experiences',
    'conversations',
    'messages',
    'provider_leads'
  )
order by tablename;

-- 3. Confirmar policies mínimas relacionadas a privacidad.
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname in ('public', 'storage')
  and (
    tablename in (
      'profiles',
      'profile_specialties',
      'experiences',
      'conversations',
      'messages',
      'providers',
      'provider_leads'
    )
    or tablename = 'objects'
  )
order by schemaname, tablename, policyname;
