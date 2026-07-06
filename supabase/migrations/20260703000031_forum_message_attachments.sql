-- Adjuntos multimedia (1 imagen o 1 video, opcional) en temas de foro, respuestas de
-- foro y mensajes privados. Storage en dos buckets nuevos: forum-media (público) y
-- message-media (privado, con URLs firmadas).

-- ─── Columnas ────────────────────────────────────────────────────────────────

alter table public.forum_topics
  add column if not exists attachment_path text,
  add column if not exists attachment_type text;

alter table public.forum_replies
  add column if not exists attachment_path text,
  add column if not exists attachment_type text;

alter table public.messages
  add column if not exists attachment_path text,
  add column if not exists attachment_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'forum_topics_attachment_consistency'
  ) then
    alter table public.forum_topics
      add constraint forum_topics_attachment_consistency
      check ((attachment_path is null) = (attachment_type is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'forum_topics_attachment_type_check'
  ) then
    alter table public.forum_topics
      add constraint forum_topics_attachment_type_check
      check (attachment_type is null or attachment_type in ('image', 'video'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'forum_replies_attachment_consistency'
  ) then
    alter table public.forum_replies
      add constraint forum_replies_attachment_consistency
      check ((attachment_path is null) = (attachment_type is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'forum_replies_attachment_type_check'
  ) then
    alter table public.forum_replies
      add constraint forum_replies_attachment_type_check
      check (attachment_type is null or attachment_type in ('image', 'video'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'messages_attachment_consistency'
  ) then
    alter table public.messages
      add constraint messages_attachment_consistency
      check ((attachment_path is null) = (attachment_type is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'messages_attachment_type_check'
  ) then
    alter table public.messages
      add constraint messages_attachment_type_check
      check (attachment_type is null or attachment_type in ('image', 'video'));
  end if;
end;
$$;

-- ─── Buckets ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'forum-media',
  'forum-media',
  true,
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-media',
  'message-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── RLS: forum-media (público, carpeta = auth.uid()) ────────────────────────
-- Mismo patrón que avatars_public_read (20260625_000022): lectura libre, escritura
-- y borrado acotados a la carpeta del propio usuario.

drop policy if exists forum_media_public_read on storage.objects;
create policy forum_media_public_read
on storage.objects
for select
using (bucket_id = 'forum-media');

drop policy if exists forum_media_insert_own on storage.objects;
create policy forum_media_insert_own
on storage.objects
for insert
with check (
  bucket_id = 'forum-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists forum_media_delete_own on storage.objects;
create policy forum_media_delete_own
on storage.objects
for delete
using (
  bucket_id = 'forum-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- No hay policy de update: los paths llevan UUID (inmutables), igual que avatares.

-- ─── RLS: message-media (privado, carpeta = conversationId/senderId) ─────────

drop policy if exists message_media_select_participant on storage.objects;
create policy message_media_select_participant
on storage.objects
for select
using (
  bucket_id = 'message-media'
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  )
);

drop policy if exists message_media_insert_own on storage.objects;
create policy message_media_insert_own
on storage.objects
for insert
with check (
  bucket_id = 'message-media'
  and auth.uid()::text = (storage.foldername(name))[2]
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and (c.participant_one_id = auth.uid() or c.participant_two_id = auth.uid())
  )
);

drop policy if exists message_media_delete_own on storage.objects;
create policy message_media_delete_own
on storage.objects
for delete
using (
  bucket_id = 'message-media'
  and auth.uid()::text = (storage.foldername(name))[2]
);

-- ─── RPC: create_forum_topic (agrega attachment_path/type) ───────────────────

drop function if exists public.create_forum_topic(text, text, text);

create or replace function public.create_forum_topic(
  category_slug text,
  title_text text,
  body_text text,
  attachment_path text default null,
  attachment_type text default null
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
    attachment_type
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
    v_attachment_type
  )
  returning forum_topics.id, forum_topics.slug
  into created_topic_id, slug;

  return next;
end;
$$;

revoke all on function public.create_forum_topic(text, text, text, text, text) from public;
grant execute on function public.create_forum_topic(text, text, text, text, text) to authenticated;

-- ─── RPC: create_forum_reply (agrega attachment_path/type, body opcional si hay adjunto) ──

drop function if exists public.create_forum_reply(text, text, uuid);

create or replace function public.create_forum_reply(
  thread_slug text,
  body_text text,
  parent_reply_id uuid default null,
  attachment_path text default null,
  attachment_type text default null
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
    attachment_type
  )
  values (
    target_topic_id,
    auth.uid(),
    parent_reply_id,
    v_body,
    'published',
    v_attachment_path,
    v_attachment_type
  )
  returning forum_replies.id
  into id;

  return next;
end;
$$;

revoke all on function public.create_forum_reply(text, text, uuid, text, text) from public;
grant execute on function public.create_forum_reply(text, text, uuid, text, text) to authenticated;

-- ─── RPC: get_forum_thread (agrega attachment del tema y de cada respuesta) ──

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

-- ─── RPC: list_forum_threads (agrega attachment_type, no el path completo) ───

drop function if exists public.list_forum_threads(text, integer);

create or replace function public.list_forum_threads(
  category_slug text default null,
  limit_count integer default null
)
returns table (
  id uuid,
  slug text,
  title text,
  excerpt text,
  body text,
  category jsonb,
  author jsonb,
  reply_count integer,
  like_count integer,
  viewer_liked boolean,
  attachment_type text,
  created_at timestamptz,
  last_activity_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with thread_rows as (
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
      (
        select count(*)::integer
        from public.forum_topic_likes likes
        where likes.topic_id = forum_topics.id
      ) as like_count,
      exists (
        select 1
        from public.forum_topic_likes likes
        where likes.topic_id = forum_topics.id
          and likes.user_id = auth.uid()
      ) as viewer_liked,
      forum_topics.attachment_type,
      forum_topics.created_at,
      forum_topics.last_activity_at
    from public.forum_topics
    join public.forum_categories on forum_categories.id = forum_topics.category_id
    join public.profiles on profiles.id = forum_topics.author_id
    left join public.companies on companies.id = profiles.current_company_id
    where forum_topics.status = 'published'
      and forum_categories.is_active = true
      and (
        nullif(trim(category_slug), '') is null
        or forum_categories.slug = trim(category_slug)
      )
    order by forum_topics.last_activity_at desc, forum_topics.created_at desc
  )
  select *
  from thread_rows
  limit case when limit_count is null or limit_count <= 0 then 100 else limit_count end;
$$;

revoke all on function public.list_forum_threads(text, integer) from public;
grant execute on function public.list_forum_threads(text, integer) to anon, authenticated;

-- ─── RPC: send_message (agrega attachment_path/type, body opcional si hay adjunto) ──

drop function if exists public.send_message(uuid, text);

create or replace function public.send_message(
  p_thread_id uuid,
  body_text text,
  attachment_path text default null,
  attachment_type text default null
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

  insert into public.messages (conversation_id, sender_id, body, attachment_path, attachment_type)
  values (p_thread_id, auth.uid(), v_body, v_attachment_path, v_attachment_type)
  returning id into new_message_id;

  update public.conversations
  set last_message_at = timezone('utc', now())
  where id = p_thread_id;

  return new_message_id;
end;
$$;

revoke all on function public.send_message(uuid, text, text, text) from public;
grant execute on function public.send_message(uuid, text, text, text) to authenticated;

-- ─── RPC: get_thread_messages (recreada preservando el filtro de clear_thread) ───

drop function if exists public.get_thread_messages(uuid);

create or replace function public.get_thread_messages(p_thread_id uuid)
returns table (
  id         uuid,
  sender_id  uuid,
  body       text,
  is_read    boolean,
  created_at timestamptz,
  attachment_path text,
  attachment_type text
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
    m.attachment_type
  from public.messages m
  where m.conversation_id = p_thread_id
    and m.created_at > coalesce(v_cleared_at, '-infinity'::timestamptz)
  order by m.created_at asc;
end;
$$;

revoke all on function public.get_thread_messages(uuid) from public;
grant execute on function public.get_thread_messages(uuid) to authenticated;

-- ─── RPC: list_my_threads (recreada agregando last_message_attachment_type) ──

drop function if exists public.list_my_threads();

create or replace function public.list_my_threads()
returns table (
  thread_id                     uuid,
  other_profile_id              uuid,
  other_full_name               text,
  other_avatar_path             text,
  other_verification_status     text,
  last_message_body             text,
  last_message_at               timestamptz,
  last_message_attachment_type  text,
  unread_count                  integer
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
      m.body           as last_body,
      m.created_at     as last_at,
      m.attachment_type as last_attachment_type
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
    lm.last_attachment_type                                           as last_message_attachment_type,
    coalesce(u.cnt, 0)                                               as unread_count
  from my_convos mc
  join public.profiles p on p.id = mc.other_id
  left join last_msgs lm on lm.conversation_id = mc.convo_id
  left join unread u     on u.conversation_id  = mc.convo_id
  where mc.my_cleared_at is null or lm.last_at is not null
  order by coalesce(lm.last_at, mc.last_message_at) desc nulls last;
$$;

revoke all on function public.list_my_threads() from public;
grant execute on function public.list_my_threads() to authenticated;

notify pgrst, 'reload schema';
