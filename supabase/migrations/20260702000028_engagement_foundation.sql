-- Engagement por email: tracking de actividad, preferencias, log de envíos y RPCs de candidatos.

-- 1a. last_seen_at + heartbeat throttled -------------------------------------------------

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

update public.profiles
set last_seen_at = greatest(created_at, updated_at)
where last_seen_at is null;

create index if not exists profiles_last_seen_at_idx
  on public.profiles (last_seen_at);

create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_seen_at = timezone('utc', now())
  where id = auth.uid()
    and (last_seen_at is null
         or last_seen_at < timezone('utc', now()) - interval '60 seconds');
$$;

revoke all on function public.touch_last_seen() from public;
grant execute on function public.touch_last_seen() to authenticated;

-- 1b. Preferencias de notificación --------------------------------------------------------
-- Tabla separada de profiles: contiene el token de unsubscribe, que no debe viajar
-- junto con datos de perfil consultados por RPCs públicas del directorio.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_unread_reminder boolean not null default true,
  email_forum_reply boolean not null default true,
  email_liked_topic_reply boolean not null default true,
  email_inactivity_digest boolean not null default true,
  unsubscribed_all boolean not null default false,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own
on public.notification_preferences
for select
using (user_id = auth.uid());

drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own
on public.notification_preferences
for insert
with check (user_id = auth.uid());

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own
on public.notification_preferences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 1c. Log de emails de engagement: dedupe + rate-limit ------------------------------------
-- Sin policies de RLS para anon/authenticated: solo el service role (edge functions) la usa.

create table if not exists public.engagement_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email_type text not null check (email_type in ('unread_reminder', 'inactivity_digest', 'liked_topic_reply')),
  dedupe_key text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  unique (user_id, email_type, dedupe_key)
);

create index if not exists engagement_email_log_user_type_sent_idx
  on public.engagement_email_log (user_id, email_type, sent_at desc);

alter table public.engagement_email_log enable row level security;

-- 1d. RPCs anónimas para gestionar preferencias vía token (link de unsubscribe) -----------

create or replace function public.get_email_prefs_by_token(p_token uuid)
returns table (
  email_unread_reminder boolean,
  email_forum_reply boolean,
  email_liked_topic_reply boolean,
  email_inactivity_digest boolean,
  unsubscribed_all boolean
)
language sql
security definer
set search_path = public
as $$
  select
    np.email_unread_reminder,
    np.email_forum_reply,
    np.email_liked_topic_reply,
    np.email_inactivity_digest,
    np.unsubscribed_all
  from public.notification_preferences np
  where np.unsubscribe_token = p_token;
$$;

create or replace function public.update_email_prefs_by_token(p_token uuid, p_prefs jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count integer;
begin
  update public.notification_preferences np
  set email_unread_reminder = coalesce((p_prefs->>'email_unread_reminder')::boolean, np.email_unread_reminder),
      email_forum_reply = coalesce((p_prefs->>'email_forum_reply')::boolean, np.email_forum_reply),
      email_liked_topic_reply = coalesce((p_prefs->>'email_liked_topic_reply')::boolean, np.email_liked_topic_reply),
      email_inactivity_digest = coalesce((p_prefs->>'email_inactivity_digest')::boolean, np.email_inactivity_digest),
      unsubscribed_all = coalesce((p_prefs->>'unsubscribed_all')::boolean, np.unsubscribed_all),
      updated_at = timezone('utc', now())
  where np.unsubscribe_token = p_token;

  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

revoke all on function public.get_email_prefs_by_token(uuid) from public;
grant execute on function public.get_email_prefs_by_token(uuid) to anon, authenticated;

revoke all on function public.update_email_prefs_by_token(uuid, jsonb) from public;
grant execute on function public.update_email_prefs_by_token(uuid, jsonb) to anon, authenticated;

-- 1e. RPCs de candidatos para la edge function engagement-emails --------------------------
-- Sin grant a anon/authenticated: solo el service role (llamado desde la edge function) las ejecuta.

create or replace function public.get_unread_reminder_candidates(
  p_min_age interval default interval '24 hours',
  p_online_grace interval default interval '30 minutes',
  p_conversation_cooldown interval default interval '72 hours'
)
returns table (
  recipient_id uuid,
  recipient_email text,
  recipient_name text,
  conversation_id uuid,
  sender_name text,
  unread_count integer,
  newest_unread_id uuid,
  oldest_unread_at timestamptz,
  preview text
)
language sql
security definer
set search_path = public
as $$
  with unread as (
    select
      m.conversation_id,
      m.id,
      m.sender_id,
      m.body,
      m.created_at,
      case when m.sender_id = c.participant_one_id
           then c.participant_two_id else c.participant_one_id end as recipient_id,
      case when m.sender_id = c.participant_one_id
           then c.participant_two_cleared_at else c.participant_one_cleared_at end as recipient_cleared_at
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.is_read = false
  ),
  filtered as (
    select u.*
    from unread u
    where u.created_at > coalesce(u.recipient_cleared_at, '-infinity'::timestamptz)
  ),
  grouped as (
    select
      f.conversation_id,
      f.recipient_id,
      count(*)::integer as unread_count,
      min(f.created_at) as oldest_unread_at,
      (array_agg(f.id order by f.created_at desc))[1] as newest_unread_id,
      (array_agg(f.sender_id order by f.created_at desc))[1] as last_sender_id,
      (array_agg(f.body order by f.created_at desc))[1] as last_body
    from filtered f
    group by f.conversation_id, f.recipient_id
    having min(f.created_at) <= timezone('utc', now()) - p_min_age
  )
  select
    g.recipient_id,
    au.email,
    coalesce(rp.full_name, 'Miembro Zucarlink'),
    g.conversation_id,
    coalesce(sp.full_name, 'Un miembro'),
    g.unread_count,
    g.newest_unread_id,
    g.oldest_unread_at,
    left(g.last_body, 200)
  from grouped g
  join auth.users au on au.id = g.recipient_id
  join public.profiles rp on rp.id = g.recipient_id
  join public.profiles sp on sp.id = g.last_sender_id
  left join public.notification_preferences np on np.user_id = g.recipient_id
  where au.email is not null
    and au.email_confirmed_at is not null
    and coalesce(np.email_unread_reminder, true)
    and not coalesce(np.unsubscribed_all, false)
    and (rp.last_seen_at is null or rp.last_seen_at < timezone('utc', now()) - p_online_grace)
    and not exists (
      select 1 from public.engagement_email_log l
      where l.user_id = g.recipient_id
        and l.email_type = 'unread_reminder'
        and l.dedupe_key like g.conversation_id::text || ':%'
        and l.sent_at > timezone('utc', now()) - p_conversation_cooldown
    );
$$;

revoke all on function public.get_unread_reminder_candidates(interval, interval, interval) from public, anon, authenticated;

create or replace function public.get_inactivity_digest_candidates(
  p_inactive_after interval default interval '7 days',
  p_resend_after interval default interval '14 days',
  p_max_sends_per_streak integer default 3
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  account_type text,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    au.email,
    coalesce(p.full_name, 'Miembro Zucarlink'),
    p.account_type,
    p.last_seen_at
  from public.profiles p
  join auth.users au on au.id = p.id
  left join public.notification_preferences np on np.user_id = p.id
  where au.email is not null
    and au.email_confirmed_at is not null
    and p.last_seen_at < timezone('utc', now()) - p_inactive_after
    and coalesce(np.email_inactivity_digest, true)
    and not coalesce(np.unsubscribed_all, false)
    and (
      select count(*) from public.engagement_email_log l
      where l.user_id = p.id
        and l.email_type = 'inactivity_digest'
        and l.sent_at > p.last_seen_at
    ) < p_max_sends_per_streak
    and not exists (
      select 1 from public.engagement_email_log l
      where l.user_id = p.id
        and l.email_type = 'inactivity_digest'
        and l.sent_at > timezone('utc', now()) - p_resend_after
    );
$$;

revoke all on function public.get_inactivity_digest_candidates(interval, interval, integer) from public, anon, authenticated;

create or replace function public.get_digest_content(p_user_id uuid, p_since timestamptz)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'unread_messages', (
      select count(*)
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.is_read = false
        and m.sender_id <> p_user_id
        and (c.participant_one_id = p_user_id or c.participant_two_id = p_user_id)
        and m.created_at > coalesce(
          case when c.participant_one_id = p_user_id
               then c.participant_one_cleared_at else c.participant_two_cleared_at end,
          '-infinity'::timestamptz)
    ),
    'my_topics_activity', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select ft.title, ft.slug, count(fr.id) as new_replies
        from public.forum_topics ft
        join public.forum_replies fr on fr.topic_id = ft.id
          and fr.status = 'published'
          and fr.created_at > p_since
          and fr.author_id <> p_user_id
        where ft.author_id = p_user_id
          and ft.status = 'published'
        group by ft.id
        order by count(fr.id) desc
        limit 3
      ) t
    ),
    'liked_topics_activity', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select ft.title, ft.slug, count(fr.id) as new_replies
        from public.forum_topic_likes ftl
        join public.forum_topics ft on ft.id = ftl.topic_id and ft.status = 'published'
        join public.forum_replies fr on fr.topic_id = ft.id
          and fr.status = 'published'
          and fr.created_at > p_since
          and fr.author_id <> p_user_id
        where ftl.user_id = p_user_id
          and ft.author_id <> p_user_id
        group by ft.id
        order by count(fr.id) desc
        limit 3
      ) t
    ),
    'popular_new_topics', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select
          ft.title,
          ft.slug,
          ft.reply_count,
          (select count(*) from public.forum_topic_likes l where l.topic_id = ft.id) as likes
        from public.forum_topics ft
        where ft.status = 'published'
          and ft.created_at > p_since
          and ft.author_id <> p_user_id
        order by ft.reply_count desc, likes desc
        limit 3
      ) t
    )
  );
$$;

revoke all on function public.get_digest_content(uuid, timestamptz) from public, anon, authenticated;
