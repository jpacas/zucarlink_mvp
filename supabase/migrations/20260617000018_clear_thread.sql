-- Borrado de conversaciones por usuario (soft-delete tipo WhatsApp).
-- Cada participante puede "limpiar" la conversación: se oculta de su lista y de
-- su historial sin afectar la copia del otro participante. Si llega un mensaje
-- nuevo después del corte, la conversación reaparece mostrando solo lo nuevo.

-- ─── Marcadores de corte por participante ────────────────────────────────────

alter table public.conversations
  add column if not exists participant_one_cleared_at timestamptz,
  add column if not exists participant_two_cleared_at timestamptz;

-- ─── clear_thread ────────────────────────────────────────────────────────────
-- Marca la conversación como limpiada para el usuario actual.
create or replace function public.clear_thread(p_thread_id uuid)
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

  update public.conversations
  set participant_one_cleared_at =
        case when participant_one_id = auth.uid()
             then timezone('utc', now())
             else participant_one_cleared_at end,
      participant_two_cleared_at =
        case when participant_two_id = auth.uid()
             then timezone('utc', now())
             else participant_two_cleared_at end
  where id = p_thread_id;
end;
$$;

-- ─── list_my_threads (recreada con filtro de corte) ──────────────────────────
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
      c.last_message_at,
      case
        when c.participant_one_id = auth.uid() then c.participant_one_cleared_at
        else c.participant_two_cleared_at
      end as my_cleared_at
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
    join my_convos mc on mc.convo_id = m.conversation_id
    where m.created_at > coalesce(mc.my_cleared_at, '-infinity'::timestamptz)
    order by m.conversation_id, m.created_at desc
  ),
  unread as (
    select
      m.conversation_id,
      count(*)::integer as cnt
    from public.messages m
    join my_convos mc on mc.convo_id = m.conversation_id
    where m.sender_id <> auth.uid()
      and m.is_read = false
      and m.created_at > coalesce(mc.my_cleared_at, '-infinity'::timestamptz)
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
  where mc.my_cleared_at is null or lm.last_at is not null
  order by coalesce(lm.last_at, mc.last_message_at) desc nulls last;
$$;

-- ─── get_thread_messages (recreada con filtro de corte) ──────────────────────
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
declare
  v_cleared_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para ver mensajes.';
  end if;

  select case
           when c.participant_one_id = auth.uid() then c.participant_one_cleared_at
           else c.participant_two_cleared_at
         end
  into v_cleared_at
  from public.conversations c
  where c.id = p_thread_id
    and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid());

  if not found then
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
    and m.created_at > coalesce(v_cleared_at, '-infinity'::timestamptz)
  order by m.created_at asc;
end;
$$;

revoke all on function public.clear_thread(uuid) from public;
grant execute on function public.clear_thread(uuid) to authenticated;
