-- Foro: cualquier miembro autenticado con email confirmado puede participar.
-- Antes se exigía profile_status = 'complete' para abrir temas. Ahora basta con
-- ser miembro de Zucarlink (sesión activa) y tener el correo confirmado.

create or replace function public.create_forum_topic(
  category_slug text,
  title_text text,
  body_text text
)
returns table (slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_category_id uuid;
  created_topic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear un tema.';
  end if;

  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo electrónico para participar en el foro.';
  end if;

  select forum_categories.id
  into active_category_id
  from public.forum_categories
  where forum_categories.slug = trim(category_slug)
    and forum_categories.is_active = true;

  if active_category_id is null then
    raise exception 'La categoría seleccionada no existe.';
  end if;

  insert into public.forum_topics (
    category_id,
    author_id,
    title,
    slug,
    body,
    status,
    reply_count,
    last_activity_at
  )
  values (
    active_category_id,
    auth.uid(),
    trim(title_text),
    public.build_unique_forum_slug(trim(title_text)),
    trim(body_text),
    'published',
    0,
    timezone('utc', now())
  )
  returning forum_topics.id, forum_topics.slug
  into created_topic_id, slug;

  return next;
end;
$$;

create or replace function public.create_forum_reply(
  thread_slug text,
  body_text text,
  parent_reply_id uuid default null
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_topic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para responder.';
  end if;

  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo electrónico para participar en el foro.';
  end if;

  select forum_topics.id
  into target_topic_id
  from public.forum_topics
  where forum_topics.slug = trim(thread_slug)
    and forum_topics.status = 'published';

  if target_topic_id is null then
    raise exception 'El tema no existe.';
  end if;

  insert into public.forum_replies (
    topic_id,
    author_id,
    parent_reply_id,
    body,
    status
  )
  values (
    target_topic_id,
    auth.uid(),
    parent_reply_id,
    trim(body_text),
    'published'
  )
  returning forum_replies.id
  into id;

  return next;
end;
$$;

revoke all on function public.create_forum_topic(text, text, text) from public;
grant execute on function public.create_forum_topic(text, text, text) to authenticated;

revoke all on function public.create_forum_reply(text, text, uuid) from public;
grant execute on function public.create_forum_reply(text, text, uuid) to authenticated;
