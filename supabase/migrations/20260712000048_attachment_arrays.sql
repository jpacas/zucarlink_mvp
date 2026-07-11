-- Adjuntos múltiples (hasta 6 por mensaje/tema/respuesta) y nuevos tipos de
-- archivo (pdf, word=.docx, excel=.xlsx) para Mensajes privados y Foro.
--
-- Reemplaza las columnas escalares attachment_path/attachment_type/
-- attachment_filename/attachment_size_bytes (1 adjunto por fila) de messages,
-- forum_topics y forum_replies por una tabla hija polimórfica única, ya que
-- las tres comparten exactamente la misma forma de adjunto y hoy solo se
-- accede a ellas vía RPC security definer (no hay REST directo).

-- ─── Tabla polimórfica de adjuntos ────────────────────────────────────────────

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('message', 'forum_topic', 'forum_reply')),
  owner_id uuid not null,
  position smallint not null check (position between 0 and 5),
  path text not null,
  media_type text not null check (media_type in ('image', 'video', 'pdf', 'word', 'excel')),
  filename text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (owner_type, owner_id, position)
);

create index attachments_owner_idx on public.attachments (owner_type, owner_id);

-- Sin policies = deny-all por defecto; solo se lee/escribe desde funciones
-- security definer (revoke all + grant execute puntual, igual que el resto
-- de las RPCs de este esquema).
alter table public.attachments enable row level security;

revoke all on public.attachments from public, anon, authenticated;

-- ─── Backfill: 1 fila (position 0) por cada adjunto escalar existente ────────

insert into public.attachments (owner_type, owner_id, position, path, media_type, filename, size_bytes)
select 'message', id, 0, attachment_path, attachment_type, coalesce(attachment_filename, 'archivo'), coalesce(attachment_size_bytes, 0)
from public.messages
where attachment_path is not null;

insert into public.attachments (owner_type, owner_id, position, path, media_type, filename, size_bytes)
select 'forum_topic', id, 0, attachment_path, attachment_type, coalesce(attachment_filename, 'archivo'), coalesce(attachment_size_bytes, 0)
from public.forum_topics
where attachment_path is not null;

insert into public.attachments (owner_type, owner_id, position, path, media_type, filename, size_bytes)
select 'forum_reply', id, 0, attachment_path, attachment_type, coalesce(attachment_filename, 'archivo'), coalesce(attachment_size_bytes, 0)
from public.forum_replies
where attachment_path is not null;

-- ─── Drop de columnas viejas + constraints ───────────────────────────────────

alter table public.messages
  drop constraint if exists messages_attachment_consistency,
  drop constraint if exists messages_attachment_type_check,
  drop constraint if exists messages_attachment_filename_consistency,
  drop column if exists attachment_path,
  drop column if exists attachment_type,
  drop column if exists attachment_filename,
  drop column if exists attachment_size_bytes;

alter table public.forum_topics
  drop constraint if exists forum_topics_attachment_consistency,
  drop constraint if exists forum_topics_attachment_type_check,
  drop constraint if exists forum_topics_attachment_filename_consistency,
  drop column if exists attachment_path,
  drop column if exists attachment_type,
  drop column if exists attachment_filename,
  drop column if exists attachment_size_bytes;

alter table public.forum_replies
  drop constraint if exists forum_replies_attachment_consistency,
  drop constraint if exists forum_replies_attachment_type_check,
  drop constraint if exists forum_replies_attachment_filename_consistency,
  drop column if exists attachment_path,
  drop column if exists attachment_type,
  drop column if exists attachment_filename,
  drop column if exists attachment_size_bytes;

-- ─── Buckets: agregar mimes de documento (pdf, docx, xlsx) ───────────────────
-- Se excluyen deliberadamente formatos legacy/macro-enabled (.doc, .xls,
-- .docm, .xlsm) por riesgo de seguridad (ver revisión de seguridad del plan).

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
where id in ('forum-media', 'message-media');

-- ─── RPC: create_forum_topic (adjuntos como array jsonb, máx. 6) ─────────────

drop function if exists public.create_forum_topic(text, text, text, text, text, text, bigint);

create or replace function public.create_forum_topic(
  category_slug text,
  title_text text,
  body_text text,
  attachments jsonb default '[]'::jsonb
)
returns table (slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_category_id uuid;
  created_topic_id uuid;
  v_attachments jsonb := coalesce(attachments, '[]'::jsonb);
  v_item jsonb;
  v_path text;
  v_type text;
  v_pos smallint := 0;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear un tema.';
  end if;

  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo electrónico para participar en el foro.';
  end if;

  if jsonb_typeof(v_attachments) <> 'array' then
    raise exception 'Formato de adjuntos inválido.';
  end if;

  if jsonb_array_length(v_attachments) > 6 then
    raise exception 'Máximo 6 adjuntos por publicación.';
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

  for v_item in select * from jsonb_array_elements(v_attachments)
  loop
    v_path := v_item->>'path';
    v_type := v_item->>'type';

    if v_path is null or v_type is null then
      raise exception 'Adjunto inválido: falta la ruta o el tipo.';
    end if;

    if v_type not in ('image', 'video', 'pdf', 'word', 'excel') then
      raise exception 'Tipo de adjunto no soportado.';
    end if;

    if v_path not like (auth.uid()::text || '/%') then
      raise exception 'Ruta de adjunto inválida.';
    end if;

    insert into public.attachments (owner_type, owner_id, position, path, media_type, filename, size_bytes)
    values (
      'forum_topic', created_topic_id, v_pos, v_path, v_type,
      coalesce(v_item->>'filename', 'archivo'),
      coalesce((v_item->>'size_bytes')::bigint, 0)
    );

    v_pos := v_pos + 1;
  end loop;

  return next;
end;
$$;

revoke all on function public.create_forum_topic(text, text, text, jsonb) from public;
grant execute on function public.create_forum_topic(text, text, text, jsonb) to authenticated;

-- ─── RPC: create_forum_reply (adjuntos como array jsonb, máx. 6) ─────────────

drop function if exists public.create_forum_reply(text, text, uuid, text, text, text, bigint);

create or replace function public.create_forum_reply(
  thread_slug text,
  body_text text,
  parent_reply_id uuid default null,
  attachments jsonb default '[]'::jsonb
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_topic_id uuid;
  created_reply_id uuid;
  v_body text := trim(coalesce(body_text, ''));
  v_attachments jsonb := coalesce(attachments, '[]'::jsonb);
  v_item jsonb;
  v_path text;
  v_type text;
  v_pos smallint := 0;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para responder.';
  end if;

  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    raise exception 'Confirma tu correo electrónico para participar en el foro.';
  end if;

  if jsonb_typeof(v_attachments) <> 'array' then
    raise exception 'Formato de adjuntos inválido.';
  end if;

  if jsonb_array_length(v_attachments) > 6 then
    raise exception 'Máximo 6 adjuntos por respuesta.';
  end if;

  if v_body = '' and jsonb_array_length(v_attachments) = 0 then
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
    status
  )
  values (
    target_topic_id,
    auth.uid(),
    parent_reply_id,
    v_body,
    'published'
  )
  returning forum_replies.id
  into created_reply_id;

  for v_item in select * from jsonb_array_elements(v_attachments)
  loop
    v_path := v_item->>'path';
    v_type := v_item->>'type';

    if v_path is null or v_type is null then
      raise exception 'Adjunto inválido: falta la ruta o el tipo.';
    end if;

    if v_type not in ('image', 'video', 'pdf', 'word', 'excel') then
      raise exception 'Tipo de adjunto no soportado.';
    end if;

    if v_path not like (auth.uid()::text || '/%') then
      raise exception 'Ruta de adjunto inválida.';
    end if;

    insert into public.attachments (owner_type, owner_id, position, path, media_type, filename, size_bytes)
    values (
      'forum_reply', created_reply_id, v_pos, v_path, v_type,
      coalesce(v_item->>'filename', 'archivo'),
      coalesce((v_item->>'size_bytes')::bigint, 0)
    );

    v_pos := v_pos + 1;
  end loop;

  id := created_reply_id;
  return next;
end;
$$;

revoke all on function public.create_forum_reply(text, text, uuid, jsonb) from public;
grant execute on function public.create_forum_reply(text, text, uuid, jsonb) to authenticated;

-- ─── RPC: get_forum_thread (agrega adjuntos como jsonb array por tema y reply) ──

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
  attachments jsonb,
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
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'path', a.path, 'type', a.media_type,
            'filename', a.filename, 'size_bytes', a.size_bytes
          )
          order by a.position
        )
        from public.attachments a
        where a.owner_type = 'forum_topic' and a.owner_id = forum_topics.id
      ),
      '[]'::jsonb
    ) as attachments,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', replies.id,
            'body', replies.body,
            'created_at', replies.created_at,
            'parent_reply_id', replies.parent_reply_id,
            'parent_author_name', parent_profiles.full_name,
            'attachments', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'path', ra.path, 'type', ra.media_type,
                    'filename', ra.filename, 'size_bytes', ra.size_bytes
                  )
                  order by ra.position
                )
                from public.attachments ra
                where ra.owner_type = 'forum_reply' and ra.owner_id = replies.id
              ),
              '[]'::jsonb
            ),
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

-- ─── RPC: list_forum_threads (attachment_type = tipo del primer adjunto) ─────

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
      (
        select a.media_type
        from public.attachments a
        where a.owner_type = 'forum_topic' and a.owner_id = forum_topics.id
        order by a.position
        limit 1
      ) as attachment_type,
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

-- ─── RPC: send_message (adjuntos como array jsonb, máx. 6) ───────────────────

drop function if exists public.send_message(uuid, text, text, text, text, bigint);

create or replace function public.send_message(
  p_thread_id uuid,
  body_text text,
  attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_message_id uuid;
  v_body text := trim(coalesce(body_text, ''));
  v_attachments jsonb := coalesce(attachments, '[]'::jsonb);
  v_item jsonb;
  v_path text;
  v_type text;
  v_pos smallint := 0;
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

  if jsonb_typeof(v_attachments) <> 'array' then
    raise exception 'Formato de adjuntos inválido.';
  end if;

  if jsonb_array_length(v_attachments) > 6 then
    raise exception 'Máximo 6 adjuntos por mensaje.';
  end if;

  if v_body = '' and jsonb_array_length(v_attachments) = 0 then
    raise exception 'El mensaje no puede estar vacío.';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_thread_id, auth.uid(), v_body)
  returning id into new_message_id;

  for v_item in select * from jsonb_array_elements(v_attachments)
  loop
    v_path := v_item->>'path';
    v_type := v_item->>'type';

    if v_path is null or v_type is null then
      raise exception 'Adjunto inválido: falta ruta o tipo.';
    end if;

    if v_type not in ('image', 'video', 'pdf', 'word', 'excel') then
      raise exception 'Tipo de adjunto no soportado.';
    end if;

    if v_path not like (p_thread_id::text || '/' || auth.uid()::text || '/%') then
      raise exception 'Ruta de adjunto inválida.';
    end if;

    insert into public.attachments (owner_type, owner_id, position, path, media_type, filename, size_bytes)
    values (
      'message', new_message_id, v_pos, v_path, v_type,
      coalesce(v_item->>'filename', 'archivo'),
      coalesce((v_item->>'size_bytes')::bigint, 0)
    );

    v_pos := v_pos + 1;
  end loop;

  update public.conversations
  set last_message_at = timezone('utc', now())
  where id = p_thread_id;

  return new_message_id;
end;
$$;

revoke all on function public.send_message(uuid, text, jsonb) from public;
grant execute on function public.send_message(uuid, text, jsonb) to authenticated;

-- ─── RPC: get_thread_messages (agrega adjuntos como jsonb array) ─────────────

drop function if exists public.get_thread_messages(uuid);

create or replace function public.get_thread_messages(p_thread_id uuid)
returns table (
  id         uuid,
  sender_id  uuid,
  body       text,
  is_read    boolean,
  created_at timestamptz,
  attachments jsonb
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
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'path', a.path, 'type', a.media_type,
            'filename', a.filename, 'size_bytes', a.size_bytes
          )
          order by a.position
        )
        from public.attachments a
        where a.owner_type = 'message' and a.owner_id = m.id
      ),
      '[]'::jsonb
    ) as attachments
  from public.messages m
  where m.conversation_id = p_thread_id
    and m.created_at > coalesce(v_cleared_at, '-infinity'::timestamptz)
  order by m.created_at asc;
end;
$$;

revoke all on function public.get_thread_messages(uuid) from public;
grant execute on function public.get_thread_messages(uuid) to authenticated;

-- ─── RPC: list_my_threads (last_message_attachment_type = 1er adjunto) ───────

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
      m.id             as last_message_id
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
    (
      select a.media_type
      from public.attachments a
      where a.owner_type = 'message' and a.owner_id = lm.last_message_id
      order by a.position
      limit 1
    )                                                                  as last_message_attachment_type,
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

-- ─── RPC: delete_forum_topic / delete_forum_reply (paths desde attachments) ──

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

  select array_remove(array_agg(a.path), null)
  into removed_paths
  from public.attachments a
  where (a.owner_type = 'forum_topic' and a.owner_id = target_topic_id)
     or (a.owner_type = 'forum_reply' and a.owner_id in (
           select id from public.forum_replies where topic_id = target_topic_id
         ));

  -- La tabla attachments no tiene FK (es polimórfica), así que no hay ON DELETE
  -- CASCADE: hay que borrar explícitamente las filas de metadata aquí.
  delete from public.attachments a
  where (a.owner_type = 'forum_topic' and a.owner_id = target_topic_id)
     or (a.owner_type = 'forum_reply' and a.owner_id in (
           select id from public.forum_replies where topic_id = target_topic_id
         ));

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
    select id from public.forum_replies where id = reply_id
    union all
    select r.id
    from public.forum_replies r
    join descendants d on r.parent_reply_id = d.id
  )
  select array_remove(array_agg(a.path), null)
  into removed_paths
  from public.attachments a
  where a.owner_type = 'forum_reply' and a.owner_id in (select id from descendants);

  -- La tabla attachments no tiene FK (es polimórfica), así que no hay ON DELETE
  -- CASCADE: hay que borrar explícitamente las filas de metadata aquí.
  delete from public.attachments a
  where a.owner_type = 'forum_reply' and a.owner_id in (select id from descendants);

  delete from public.forum_replies
  where forum_replies.id = reply_id;

  return removed_paths;
end;
$$;

revoke all on function public.delete_forum_topic(text) from public;
grant execute on function public.delete_forum_topic(text) to authenticated;

revoke all on function public.delete_forum_reply(uuid) from public;
grant execute on function public.delete_forum_reply(uuid) to authenticated;

notify pgrst, 'reload schema';
