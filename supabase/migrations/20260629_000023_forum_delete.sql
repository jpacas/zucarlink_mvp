-- Foro: el autor puede eliminar permanentemente sus propios temas y respuestas.
-- La cascada de borrado ya está garantizada por las llaves foráneas:
--   forum_replies.topic_id        -> forum_topics(id)   ON DELETE CASCADE
--   forum_replies.parent_reply_id -> forum_replies(id)  ON DELETE CASCADE
-- y el trigger sync_forum_topic_metrics recalcula reply_count/last_activity_at.
-- Como estas funciones usan security definer (saltan RLS), validan la propiedad
-- explícitamente con auth.uid() antes de borrar.

create or replace function public.delete_forum_topic(thread_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select forum_topics.author_id
  into target_author_id
  from public.forum_topics
  where forum_topics.slug = trim(thread_slug);

  if target_author_id is null then
    raise exception 'El tema no existe.';
  end if;

  if target_author_id <> auth.uid() then
    raise exception 'Solo el autor puede eliminar este tema.';
  end if;

  delete from public.forum_topics
  where forum_topics.slug = trim(thread_slug);
end;
$$;

create or replace function public.delete_forum_reply(reply_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select forum_replies.author_id
  into target_author_id
  from public.forum_replies
  where forum_replies.id = reply_id;

  if target_author_id is null then
    raise exception 'La respuesta no existe.';
  end if;

  if target_author_id <> auth.uid() then
    raise exception 'Solo el autor puede eliminar esta respuesta.';
  end if;

  delete from public.forum_replies
  where forum_replies.id = reply_id;
end;
$$;

revoke all on function public.delete_forum_topic(text) from public;
grant execute on function public.delete_forum_topic(text) to authenticated;

revoke all on function public.delete_forum_reply(uuid) from public;
grant execute on function public.delete_forum_reply(uuid) to authenticated;
