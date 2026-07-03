-- RPC ligera para el badge de no-leídos: un solo count() en vez de traer todos los
-- threads con list_my_threads(). Usa el índice parcial messages_is_read_idx
-- (conversation_id, is_read) where is_read = false, ya creado en 20260423_000012.

create or replace function public.count_my_unread()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
    and m.sender_id <> auth.uid()
    and m.is_read = false;
$$;

revoke all on function public.count_my_unread() from public;
grant execute on function public.count_my_unread() to authenticated;
