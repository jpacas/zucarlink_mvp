-- Adapt existing conversations + messages tables for the messaging module.
-- The initial schema already created both tables; we add the missing columns
-- and create the RPC functions that the UI expects.

-- ─── Add missing columns ────────────────────────────────────────────────────

alter table public.conversations
  add column if not exists last_message_at timestamptz;

alter table public.messages
  add column if not exists is_read boolean not null default false;

-- Backfill last_message_at for existing conversations
update public.conversations c
set last_message_at = (
  select max(m.created_at)
  from public.messages m
  where m.conversation_id = c.id
)
where last_message_at is null;

-- ─── Additional indexes ─────────────────────────────────────────────────────

create index if not exists conversations_participant_one_id_idx
  on public.conversations (participant_one_id);

create index if not exists conversations_participant_two_id_idx
  on public.conversations (participant_two_id);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_is_read_idx
  on public.messages (conversation_id, is_read)
  where is_read = false;

-- ─── start_or_get_thread ────────────────────────────────────────────────────
-- Returns conversation id between current user and other_profile_id.
-- Creates it if it doesn't exist.
create or replace function public.start_or_get_thread(other_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  result_id       uuid;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para enviar mensajes.';
  end if;

  if other_profile_id = current_user_id then
    raise exception 'No puedes enviarte mensajes a ti mismo.';
  end if;

  -- Look for existing conversation (participants stored in either order)
  select id into result_id
  from public.conversations
  where (participant_one_id = current_user_id and participant_two_id = other_profile_id)
     or (participant_one_id = other_profile_id and participant_two_id = current_user_id)
  limit 1;

  if result_id is null then
    insert into public.conversations (participant_one_id, participant_two_id)
    values (current_user_id, other_profile_id)
    returning id into result_id;
  end if;

  return result_id;
end;
$$;

-- ─── list_my_threads ────────────────────────────────────────────────────────
create or replace function public.list_my_threads()
returns table (
  thread_id                 uuid,
  other_profile_id          uuid,
  other_full_name           text,
  other_avatar_path         text,
  other_verification_status text,
  last_message_body         text,
  last_message_at           timestamptz,
  unread_count              integer
)
language sql
security definer
set search_path = public
as $$
  with my_convos as (
    select
      c.id as convo_id,
      case
        when c.participant_one_id = auth.uid() then c.participant_two_id
        else c.participant_one_id
      end as other_id,
      c.last_message_at
    from public.conversations c
    where c.participant_one_id = auth.uid()
       or c.participant_two_id = auth.uid()
  ),
  last_msgs as (
    select distinct on (m.conversation_id)
      m.conversation_id,
      m.body         as last_body,
      m.created_at   as last_at
    from public.messages m
    where m.conversation_id in (select convo_id from my_convos)
    order by m.conversation_id, m.created_at desc
  ),
  unread as (
    select
      m.conversation_id,
      count(*)::integer as cnt
    from public.messages m
    where m.conversation_id in (select convo_id from my_convos)
      and m.sender_id <> auth.uid()
      and m.is_read = false
    group by m.conversation_id
  )
  select
    mc.convo_id                                                       as thread_id,
    mc.other_id                                                       as other_profile_id,
    coalesce(p.full_name, 'Miembro Zucarlink')                       as other_full_name,
    p.avatar_path                                                     as other_avatar_path,
    coalesce(p.verification_status, 'unverified')                     as other_verification_status,
    coalesce(lm.last_body, '')                                        as last_message_body,
    coalesce(lm.last_at, mc.last_message_at)                         as last_message_at,
    coalesce(u.cnt, 0)                                               as unread_count
  from my_convos mc
  join public.profiles p on p.id = mc.other_id
  left join last_msgs lm on lm.conversation_id = mc.convo_id
  left join unread u     on u.conversation_id  = mc.convo_id
  order by coalesce(lm.last_at, mc.last_message_at) desc nulls last;
$$;

-- ─── get_thread_messages ────────────────────────────────────────────────────
create or replace function public.get_thread_messages(p_thread_id uuid)
returns table (
  id         uuid,
  sender_id  uuid,
  body       text,
  is_read    boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para ver mensajes.';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_thread_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  ) then
    raise exception 'No tienes acceso a esta conversación.';
  end if;

  return query
  select
    m.id,
    m.sender_id,
    m.body,
    m.is_read,
    m.created_at
  from public.messages m
  where m.conversation_id = p_thread_id
  order by m.created_at asc;
end;
$$;

-- ─── send_message ────────────────────────────────────────────────────────────
create or replace function public.send_message(p_thread_id uuid, body_text text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_message_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para enviar mensajes.';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_thread_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  ) then
    raise exception 'No tienes acceso a esta conversación.';
  end if;

  if length(trim(body_text)) = 0 then
    raise exception 'El mensaje no puede estar vacío.';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_thread_id, auth.uid(), trim(body_text))
  returning id into new_message_id;

  update public.conversations
  set last_message_at = timezone('utc', now())
  where id = p_thread_id;

  return new_message_id;
end;
$$;

-- ─── mark_thread_read ───────────────────────────────────────────────────────
create or replace function public.mark_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_thread_id
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  ) then
    raise exception 'No tienes acceso a esta conversación.';
  end if;

  update public.messages
  set is_read = true
  where conversation_id = p_thread_id
    and sender_id <> auth.uid()
    and is_read = false;
end;
$$;

revoke all on function public.start_or_get_thread(uuid)         from public;
revoke all on function public.list_my_threads()                  from public;
revoke all on function public.get_thread_messages(uuid)          from public;
revoke all on function public.send_message(uuid, text)           from public;
revoke all on function public.mark_thread_read(uuid)             from public;

grant execute on function public.start_or_get_thread(uuid)         to authenticated;
grant execute on function public.list_my_threads()                  to authenticated;
grant execute on function public.get_thread_messages(uuid)          to authenticated;
grant execute on function public.send_message(uuid, text)           to authenticated;
grant execute on function public.mark_thread_read(uuid)             to authenticated;
