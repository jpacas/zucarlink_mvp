-- delete_forum_topic/delete_forum_reply borran filas de forum_topics/forum_replies
-- pero nunca los archivos asociados en el bucket forum-media (attachment_path),
-- dejando huérfanos permanentes en Storage. Estas funciones ahora devuelven los
-- attachment_path de la fila borrada Y de todos sus descendientes (respuestas
-- anidadas borradas en cascada por ON DELETE CASCADE), para que el cliente pueda
-- borrarlos de Storage inmediatamente después.

-- CREATE OR REPLACE no permite cambiar el tipo de retorno (void -> text[]).
drop function if exists public.delete_forum_topic(text);
drop function if exists public.delete_forum_reply(uuid);

create or replace function public.delete_forum_topic(thread_slug text)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author_id uuid;
  target_topic_id uuid;
  removed_paths text[];
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select forum_topics.author_id, forum_topics.id
  into target_author_id, target_topic_id
  from public.forum_topics
  where forum_topics.slug = trim(thread_slug);

  if target_author_id is null then
    raise exception 'El tema no existe.';
  end if;

  if target_author_id <> auth.uid() then
    raise exception 'Solo el autor puede eliminar este tema.';
  end if;

  select array_remove(array_agg(paths.attachment_path), null)
  into removed_paths
  from (
    select attachment_path from public.forum_topics where id = target_topic_id
    union all
    select attachment_path from public.forum_replies where topic_id = target_topic_id
  ) as paths;

  delete from public.forum_topics
  where forum_topics.slug = trim(thread_slug);

  return removed_paths;
end;
$$;

create or replace function public.delete_forum_reply(reply_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author_id uuid;
  removed_paths text[];
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

  -- CTE recursivo: el ON DELETE CASCADE de parent_reply_id borra sub-hilos
  -- completos, así que hay que recolectar los adjuntos de todos los descendientes.
  with recursive descendants as (
    select id, attachment_path from public.forum_replies where id = reply_id
    union all
    select r.id, r.attachment_path
    from public.forum_replies r
    join descendants d on r.parent_reply_id = d.id
  )
  select array_remove(array_agg(attachment_path), null)
  into removed_paths
  from descendants;

  delete from public.forum_replies
  where forum_replies.id = reply_id;

  return removed_paths;
end;
$$;

revoke all on function public.delete_forum_topic(text) from public;
grant execute on function public.delete_forum_topic(text) to authenticated;

revoke all on function public.delete_forum_reply(uuid) from public;
grant execute on function public.delete_forum_reply(uuid) to authenticated;
