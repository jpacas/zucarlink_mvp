-- Persiste nombre original y peso (bytes) del adjunto: hoy los archivos se suben
-- con un UUID como nombre y no hay forma de mostrarle al usuario qué subió ni
-- cuánto pesa. El tamaño guardado es el del blob YA subido (post downscale de
-- imagen), no el del File original seleccionado.

alter table public.forum_topics
  add column if not exists attachment_filename text,
  add column if not exists attachment_size_bytes bigint;

alter table public.forum_replies
  add column if not exists attachment_filename text,
  add column if not exists attachment_size_bytes bigint;

alter table public.messages
  add column if not exists attachment_filename text,
  add column if not exists attachment_size_bytes bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'forum_topics_attachment_filename_consistency'
  ) then
    alter table public.forum_topics
      add constraint forum_topics_attachment_filename_consistency
      check ((attachment_path is null) = (attachment_filename is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'forum_replies_attachment_filename_consistency'
  ) then
    alter table public.forum_replies
      add constraint forum_replies_attachment_filename_consistency
      check ((attachment_path is null) = (attachment_filename is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'messages_attachment_filename_consistency'
  ) then
    alter table public.messages
      add constraint messages_attachment_filename_consistency
      check ((attachment_path is null) = (attachment_filename is null));
  end if;
end;
$$;

-- ─── RPC: create_forum_topic (agrega attachment_filename/size_bytes) ─────────

drop function if exists public.create_forum_topic(text, text, text, text, text);

create or replace function public.create_forum_topic(
  category_slug text,
  title_text text,
  body_text text,
  attachment_path text default null,
  attachment_type text default null,
  attachment_filename text default null,
  attachment_size_bytes bigint default null
)
returns table (slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_category_id uuid;
  created_topic_id uuid;
  v_attachment_path text := nullif(trim(coalesce(attachment_path, '')), '');
  v_attachment_type text := nullif(trim(coalesce(attachment_type, '')), '');
  v_attachment_filename text := nullif(trim(coalesce(attachment_filename, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear un tema.';
  end if;

  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo electrónico para participar en el foro.';
  end if;

  if (v_attachment_path is null) <> (v_attachment_type is null) then
    raise exception 'Adjunto inválido: falta la ruta o el tipo.';
  end if;

  if (v_attachment_path is null) <> (v_attachment_filename is null) then
    raise exception 'Adjunto inválido: falta el nombre de archivo.';
  end if;

  if v_attachment_type is not null and v_attachment_type not in ('image', 'video') then
    raise exception 'Tipo de adjunto no soportado.';
  end if;

  if v_attachment_path is not null
     and v_attachment_path not like (auth.uid()::text || '/%') then
    raise exception 'Ruta de adjunto inválida.';
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
    last_activity_at,
    attachment_path,
    attachment_type,
    attachment_filename,
    attachment_size_bytes
  )
  values (
    active_category_id,
    auth.uid(),
    trim(title_text),
    public.build_unique_forum_slug(trim(title_text)),
    trim(body_text),
    'published',
    0,
    timezone('utc', now()),
    v_attachment_path,
    v_attachment_type,
    v_attachment_filename,
    attachment_size_bytes
  )
  returning forum_topics.id, forum_topics.slug
  into created_topic_id, slug;

  return next;
end;
$$;

revoke all on function public.create_forum_topic(text, text, text, text, text, text, bigint) from public;
grant execute on function public.create_forum_topic(text, text, text, text, text, text, bigint) to authenticated;

-- ─── RPC: create_forum_reply (agrega attachment_filename/size_bytes) ─────────

drop function if exists public.create_forum_reply(text, text, uuid, text, text);

create or replace function public.create_forum_reply(
  thread_slug text,
  body_text text,
  parent_reply_id uuid default null,
  attachment_path text default null,
  attachment_type text default null,
  attachment_filename text default null,
  attachment_size_bytes bigint default null
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_topic_id uuid;
  v_body text := trim(coalesce(body_text, ''));
  v_attachment_path text := nullif(trim(coalesce(attachment_path, '')), '');
  v_attachment_type text := nullif(trim(coalesce(attachment_type, '')), '');
  v_attachment_filename text := nullif(trim(coalesce(attachment_filename, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para responder.';
  end if;

  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo electrónico para participar en el foro.';
  end if;

  if (v_attachment_path is null) <> (v_attachment_type is null) then
    raise exception 'Adjunto inválido: falta la ruta o el tipo.';
  end if;

  if (v_attachment_path is null) <> (v_attachment_filename is null) then
    raise exception 'Adjunto inválido: falta el nombre de archivo.';
  end if;

  if v_attachment_type is not null and v_attachment_type not in ('image', 'video') then
    raise exception 'Tipo de adjunto no soportado.';
  end if;

  if v_attachment_path is not null
     and v_attachment_path not like (auth.uid()::text || '/%') then
    raise exception 'Ruta de adjunto inválida.';
  end if;

  if v_body = '' and v_attachment_path is null then
    raise exception 'La respuesta no puede estar vacía.';
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
    status,
    attachment_path,
    attachment_type,
    attachment_filename,
    attachment_size_bytes
  )
  values (
    target_topic_id,
    auth.uid(),
    parent_reply_id,
    v_body,
    'published',
    v_attachment_path,
    v_attachment_type,
    v_attachment_filename,
    attachment_size_bytes
  )
  returning forum_replies.id
  into id;

  return next;
end;
$$;

revoke all on function public.create_forum_reply(text, text, uuid, text, text, text, bigint) from public;
grant execute on function public.create_forum_reply(text, text, uuid, text, text, text, bigint) to authenticated;

-- ─── RPC: get_forum_thread (agrega attachment_filename/size_bytes) ───────────

drop function if exists public.get_forum_thread(text);

create or replace function public.get_forum_thread(thread_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  excerpt text,
  body text,
  category jsonb,
  author jsonb,
  reply_count integer,
  created_at timestamptz,
  last_activity_at timestamptz,
  attachment_path text,
  attachment_type text,
  attachment_filename text,
  attachment_size_bytes bigint,
  replies jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    forum_topics.id,
    forum_topics.slug,
    forum_topics.title,
    left(forum_topics.body, 220) as excerpt,
    forum_topics.body,
    jsonb_build_object(
      'slug', forum_categories.slug,
      'name', forum_categories.name
    ) as category,
    jsonb_build_object(
      'id', profiles.id,
      'full_name', profiles.full_name,
      'role_title', profiles.role_title,
      'organization_name', coalesce(companies.name, ''),
      'avatar_path', profiles.avatar_path,
      'verification_status', profiles.verification_status
    ) as author,
    forum_topics.reply_count,
    forum_topics.created_at,
    forum_topics.last_activity_at,
    forum_topics.attachment_path,
    forum_topics.attachment_type,
    forum_topics.attachment_filename,
    forum_topics.attachment_size_bytes,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', replies.id,
            'body', replies.body,
            'created_at', replies.created_at,
            'parent_reply_id', replies.parent_reply_id,
            'parent_author_name', parent_profiles.full_name,
            'attachment_path', replies.attachment_path,
            'attachment_type', replies.attachment_type,
            'attachment_filename', replies.attachment_filename,
            'attachment_size_bytes', replies.attachment_size_bytes,
            'author', jsonb_build_object(
              'id', reply_profiles.id,
              'full_name', reply_profiles.full_name,
              'role_title', reply_profiles.role_title,
              'organization_name', coalesce(reply_companies.name, ''),
              'avatar_path', reply_profiles.avatar_path,
              'verification_status', reply_profiles.verification_status
            )
          )
          order by replies.created_at asc
        )
        from public.forum_replies replies
        join public.profiles reply_profiles on reply_profiles.id = replies.author_id
        left join public.companies reply_companies
          on reply_companies.id = reply_profiles.current_company_id
        left join public.forum_replies parent_replies
          on parent_replies.id = replies.parent_reply_id
        left join public.profiles parent_profiles
          on parent_profiles.id = parent_replies.author_id
        where replies.topic_id = forum_topics.id
          and replies.status = 'published'
      ),
      '[]'::jsonb
    ) as replies
  from public.forum_topics
  join public.forum_categories on forum_categories.id = forum_topics.category_id
  join public.profiles on profiles.id = forum_topics.author_id
  left join public.companies on companies.id = profiles.current_company_id
  where forum_topics.slug = trim(thread_slug)
    and forum_topics.status = 'published'
    and forum_categories.is_active = true;
$$;

revoke all on function public.get_forum_thread(text) from public;
grant execute on function public.get_forum_thread(text) to anon, authenticated;

-- ─── RPC: send_message (agrega attachment_filename/size_bytes) ───────────────

drop function if exists public.send_message(uuid, text, text, text);

create or replace function public.send_message(
  p_thread_id uuid,
  body_text text,
  attachment_path text default null,
  attachment_type text default null,
  attachment_filename text default null,
  attachment_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_message_id uuid;
  v_body text := trim(coalesce(body_text, ''));
  v_attachment_path text := nullif(trim(coalesce(attachment_path, '')), '');
  v_attachment_type text := nullif(trim(coalesce(attachment_type, '')), '');
  v_attachment_filename text := nullif(trim(coalesce(attachment_filename, '')), '');
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

  if (v_attachment_path is null) <> (v_attachment_type is null) then
    raise exception 'Adjunto inválido: falta la ruta o el tipo.';
  end if;

  if (v_attachment_path is null) <> (v_attachment_filename is null) then
    raise exception 'Adjunto inválido: falta el nombre de archivo.';
  end if;

  if v_attachment_type is not null and v_attachment_type not in ('image', 'video') then
    raise exception 'Tipo de adjunto no soportado.';
  end if;

  if v_attachment_path is not null
     and v_attachment_path not like (p_thread_id::text || '/' || auth.uid()::text || '/%') then
    raise exception 'Ruta de adjunto inválida.';
  end if;

  if v_body = '' and v_attachment_path is null then
    raise exception 'El mensaje no puede estar vacío.';
  end if;

  insert into public.messages (
    conversation_id,
    sender_id,
    body,
    attachment_path,
    attachment_type,
    attachment_filename,
    attachment_size_bytes
  )
  values (
    p_thread_id,
    auth.uid(),
    v_body,
    v_attachment_path,
    v_attachment_type,
    v_attachment_filename,
    attachment_size_bytes
  )
  returning id into new_message_id;

  update public.conversations
  set last_message_at = timezone('utc', now())
  where id = p_thread_id;

  return new_message_id;
end;
$$;

revoke all on function public.send_message(uuid, text, text, text, text, bigint) from public;
grant execute on function public.send_message(uuid, text, text, text, text, bigint) to authenticated;

-- ─── RPC: get_thread_messages (agrega attachment_filename/size_bytes) ────────

drop function if exists public.get_thread_messages(uuid);

create or replace function public.get_thread_messages(p_thread_id uuid)
returns table (
  id         uuid,
  sender_id  uuid,
  body       text,
  is_read    boolean,
  created_at timestamptz,
  attachment_path text,
  attachment_type text,
  attachment_filename text,
  attachment_size_bytes bigint
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
    m.created_at,
    m.attachment_path,
    m.attachment_type,
    m.attachment_filename,
    m.attachment_size_bytes
  from public.messages m
  where m.conversation_id = p_thread_id
    and m.created_at > coalesce(v_cleared_at, '-infinity'::timestamptz)
  order by m.created_at asc;
end;
$$;

revoke all on function public.get_thread_messages(uuid) from public;
grant execute on function public.get_thread_messages(uuid) to authenticated;
