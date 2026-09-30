-- T18: centro de notificaciones in-app. Cubre respuesta de foro y like de
-- tema — mensajes quedan EXCLUIDOS a propósito (ambas voces del design
-- review coincidieron: un mensaje nuevo ya incrementa el badge de Mensajes
-- existente, señalarlo también acá sería doble aviso del mismo evento).
--
-- Audiencia de "forum_reply" espejada de la que ya usa el email existente
-- (on-forum-reply.ts / README "Notifica al autor del tema y a quienes le
-- dieron like"): autor del tema + likers del tema, nunca el propio autor de
-- la respuesta.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  type text not null check (type in ('forum_reply', 'topic_liked')),
  topic_id uuid references public.forum_topics (id) on delete cascade,
  reply_id uuid references public.forum_replies (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
using (recipient_id = auth.uid());

-- Solo permite marcar como leída (read_at), no cambiar ningún otro campo —
-- reforzado además por el RPC de abajo, que es el único camino real desde el
-- cliente.
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- ─── Triggers que generan notificaciones ────────────────────────────────────

create or replace function public.notify_on_forum_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_topic_author_id uuid;
begin
  select author_id into v_topic_author_id
  from public.forum_topics
  where id = new.topic_id;

  if v_topic_author_id is not null and v_topic_author_id <> new.author_id then
    insert into public.notifications (recipient_id, actor_id, type, topic_id, reply_id)
    values (v_topic_author_id, new.author_id, 'forum_reply', new.topic_id, new.id);
  end if;

  insert into public.notifications (recipient_id, actor_id, type, topic_id, reply_id)
  select ftl.user_id, new.author_id, 'forum_reply', new.topic_id, new.id
  from public.forum_topic_likes ftl
  where ftl.topic_id = new.topic_id
    and ftl.user_id <> new.author_id
    and ftl.user_id <> coalesce(v_topic_author_id, '00000000-0000-0000-0000-000000000000'::uuid);

  return new;
end;
$$;

drop trigger if exists forum_replies_notify_after_insert on public.forum_replies;
create trigger forum_replies_notify_after_insert
  after insert on public.forum_replies
  for each row
  execute function public.notify_on_forum_reply();

create or replace function public.notify_on_topic_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id
  from public.forum_topics
  where id = new.topic_id;

  if v_author_id is not null and v_author_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, topic_id)
    values (v_author_id, new.user_id, 'topic_liked', new.topic_id);
  end if;

  return new;
end;
$$;

drop trigger if exists forum_topic_likes_notify_after_insert on public.forum_topic_likes;
create trigger forum_topic_likes_notify_after_insert
  after insert on public.forum_topic_likes
  for each row
  execute function public.notify_on_topic_like();

-- ─── RPCs para el cliente ────────────────────────────────────────────────────

create or replace function public.count_my_unread_notifications()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.notifications
  where recipient_id = auth.uid()
    and read_at is null;
$$;

create or replace function public.get_my_notifications(limit_count integer default 20)
returns table (
  id uuid,
  type text,
  actor_name text,
  topic_title text,
  topic_slug text,
  read_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    n.id,
    n.type,
    coalesce(p.full_name, '') as actor_name,
    coalesce(t.title, '') as topic_title,
    coalesce(t.slug, '') as topic_slug,
    n.read_at,
    n.created_at
  from public.notifications n
  left join public.profiles p on p.id = n.actor_id
  left join public.forum_topics t on t.id = n.topic_id
  where n.recipient_id = auth.uid()
  order by n.created_at desc
  limit least(greatest(limit_count, 1), 100);
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set read_at = timezone('utc', now())
  where id = p_notification_id
    and recipient_id = auth.uid()
    and read_at is null;
$$;

revoke all on function public.count_my_unread_notifications() from public;
revoke all on function public.get_my_notifications(integer) from public;
revoke all on function public.mark_notification_read(uuid) from public;

grant execute on function public.count_my_unread_notifications() to authenticated;
grant execute on function public.get_my_notifications(integer) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;

notify pgrst, 'reload schema';
