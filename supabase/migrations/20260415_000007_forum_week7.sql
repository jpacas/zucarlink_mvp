create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

alter table public.forum_categories
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true;

alter table public.forum_topics
  add column if not exists slug text,
  add column if not exists status text not null default 'published',
  add column if not exists reply_count integer not null default 0,
  add column if not exists last_activity_at timestamptz;

alter table public.forum_topics
  drop constraint if exists forum_topics_status_check;

alter table public.forum_topics
  add constraint forum_topics_status_check
  check (status in ('published', 'hidden', 'archived'));

alter table public.forum_replies
  add column if not exists parent_reply_id uuid references public.forum_replies (id) on delete cascade,
  add column if not exists status text not null default 'published';

alter table public.forum_replies
  drop constraint if exists forum_replies_status_check;

alter table public.forum_replies
  add constraint forum_replies_status_check
  check (status in ('published', 'hidden'));

update public.forum_topics
set slug = public.slugify(title)
where slug is null or btrim(slug) = '';

update public.forum_topics
set slug = slug || '-' || left(id::text, 8)
where exists (
  select 1
  from public.forum_topics duplicates
  where duplicates.slug = forum_topics.slug
    and duplicates.id <> forum_topics.id
);

update public.forum_topics
set last_activity_at = coalesce(last_activity_at, updated_at, created_at)
where last_activity_at is null;

create unique index if not exists forum_topics_slug_idx
  on public.forum_topics (slug);

create index if not exists forum_topics_last_activity_at_idx
  on public.forum_topics (last_activity_at desc);

create index if not exists forum_replies_parent_reply_id_idx
  on public.forum_replies (parent_reply_id);

create or replace function public.ensure_forum_reply_thread_consistency()
returns trigger
language plpgsql
as $$
declare
  parent_thread_id uuid;
begin
  if new.parent_reply_id is null then
    return new;
  end if;

  select forum_replies.topic_id
  into parent_thread_id
  from public.forum_replies
  where forum_replies.id = new.parent_reply_id;

  if parent_thread_id is null then
    raise exception 'La respuesta padre no existe.';
  end if;

  if parent_thread_id <> new.topic_id then
    raise exception 'La respuesta padre pertenece a otro tema.';
  end if;

  return new;
end;
$$;

drop trigger if exists forum_replies_validate_parent_thread on public.forum_replies;
create trigger forum_replies_validate_parent_thread
before insert or update on public.forum_replies
for each row
execute function public.ensure_forum_reply_thread_consistency();

create or replace function public.refresh_forum_topic_metrics(target_topic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_topics
  set
    reply_count = (
      select count(*)::integer
      from public.forum_replies
      where forum_replies.topic_id = target_topic_id
        and forum_replies.status = 'published'
    ),
    last_activity_at = coalesce(
      (
        select max(activity_at)
        from (
          select forum_topics.created_at as activity_at
          from public.forum_topics
          where forum_topics.id = target_topic_id
          union all
          select forum_replies.created_at as activity_at
          from public.forum_replies
          where forum_replies.topic_id = target_topic_id
            and forum_replies.status = 'published'
        ) activity
      ),
      forum_topics.created_at
    )
  where forum_topics.id = target_topic_id;
end;
$$;

create or replace function public.sync_forum_topic_metrics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_forum_topic_metrics(old.topic_id);
    return old;
  end if;

  perform public.refresh_forum_topic_metrics(new.topic_id);

  if tg_op = 'UPDATE' and old.topic_id <> new.topic_id then
    perform public.refresh_forum_topic_metrics(old.topic_id);
  end if;

  return new;
end;
$$;

drop trigger if exists forum_replies_sync_topic_metrics on public.forum_replies;
create trigger forum_replies_sync_topic_metrics
after insert or update or delete on public.forum_replies
for each row
execute function public.sync_forum_topic_metrics();

create or replace function public.build_unique_forum_slug(base_text text, topic_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_slug text := public.slugify(base_text);
  candidate text;
  suffix integer := 1;
begin
  if normalized_slug = '' then
    normalized_slug := 'tema';
  end if;

  candidate := normalized_slug;

  while exists (
    select 1
    from public.forum_topics
    where forum_topics.slug = candidate
      and (topic_id is null or forum_topics.id <> topic_id)
  ) loop
    suffix := suffix + 1;
    candidate := normalized_slug || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

insert into public.forum_categories (slug, name, description, sort_order, is_active)
values
  ('molienda', 'Molienda', 'Preparación de caña, tándem y pérdidas en extracción.', 10, true),
  ('extraccion', 'Extracción', 'Balance de sacarosa, imbibición y eficiencia de proceso.', 20, true),
  ('agricola', 'Agrícola', 'Campo, riego, cosecha y calidad de materia prima.', 30, true),
  ('mantenimiento', 'Mantenimiento', 'Confiabilidad, paros y mantenimiento mecánico o eléctrico.', 40, true),
  ('energia', 'Energía', 'Vapor, calderas, cogeneración y eficiencia térmica.', 50, true),
  ('automatizacion', 'Automatización', 'PLC, instrumentación, datos y control avanzado.', 60, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

drop policy if exists forum_categories_public_read on public.forum_categories;
create policy forum_categories_public_read
on public.forum_categories
for select
using (is_active = true);

drop policy if exists forum_topics_public_read on public.forum_topics;
create policy forum_topics_public_read
on public.forum_topics
for select
using (status = 'published');

drop policy if exists forum_replies_public_read on public.forum_replies;
create policy forum_replies_public_read
on public.forum_replies
for select
using (status = 'published');

create or replace function public.list_forum_categories()
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  sort_order integer
)
language sql
security definer
set search_path = public
as $$
  select
    forum_categories.id,
    forum_categories.slug,
    forum_categories.name,
    coalesce(forum_categories.description, '') as description,
    forum_categories.sort_order
  from public.forum_categories
  where forum_categories.is_active = true
  order by forum_categories.sort_order asc, forum_categories.name asc;
$$;

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
            'id', replies.id,
            'body', replies.body,
            'created_at', replies.created_at,
            'parent_reply_id', replies.parent_reply_id,
            'parent_author_name', parent_profiles.full_name,
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
  current_profile_status text;
  created_topic_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear un tema.';
  end if;

  select forum_categories.id
  into active_category_id
  from public.forum_categories
  where forum_categories.slug = trim(category_slug)
    and forum_categories.is_active = true;

  if active_category_id is null then
    raise exception 'La categoría seleccionada no existe.';
  end if;

  select profiles.profile_status
  into current_profile_status
  from public.profiles
  where profiles.id = auth.uid();

  if current_profile_status <> 'complete' then
    raise exception 'Completa tu perfil antes de abrir un tema.';
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

create or replace function public.get_public_member_profile(profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_path text,
  role_title text,
  organization_name text,
  country text,
  short_bio text,
  verification_status text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_path,
    profiles.role_title,
    coalesce(companies.name, '') as organization_name,
    coalesce(profiles.country, '') as country,
    coalesce(profiles.short_bio, '') as short_bio,
    profiles.verification_status
  from public.profiles
  left join public.companies on companies.id = profiles.current_company_id
  where profiles.id = profile_id;
$$;

create or replace function public.get_profile_forum_activity(profile_id uuid)
returns table (
  thread_count integer,
  reply_count integer,
  top_categories text[],
  recent_contributions jsonb
)
language sql
security definer
set search_path = public
as $$
  with thread_activity as (
    select
      forum_topics.id,
      forum_topics.title,
      forum_topics.slug,
      forum_topics.created_at,
      forum_categories.name as category_name
    from public.forum_topics
    join public.forum_categories on forum_categories.id = forum_topics.category_id
    where forum_topics.author_id = profile_id
      and forum_topics.status = 'published'
  ),
  reply_activity as (
    select
      forum_replies.id,
      forum_topics.title,
      forum_topics.slug,
      forum_replies.created_at,
      forum_categories.name as category_name
    from public.forum_replies
    join public.forum_topics on forum_topics.id = forum_replies.topic_id
    join public.forum_categories on forum_categories.id = forum_topics.category_id
    where forum_replies.author_id = profile_id
      and forum_replies.status = 'published'
      and forum_topics.status = 'published'
  ),
  category_counts as (
    select category_name, count(*) as total
    from (
      select thread_activity.category_name from thread_activity
      union all
      select reply_activity.category_name from reply_activity
    ) combined
    group by category_name
    order by total desc, category_name asc
    limit 3
  ),
  recent_items as (
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'type', item_type,
        'title', title,
        'slug', slug,
        'created_at', created_at
      )
      order by created_at desc
    ) as payload
    from (
      select thread_activity.id, 'thread'::text as item_type, thread_activity.title, thread_activity.slug, thread_activity.created_at
      from thread_activity
      union all
      select reply_activity.id, 'reply'::text as item_type, reply_activity.title, reply_activity.slug, reply_activity.created_at
      from reply_activity
      order by created_at desc
      limit 5
    ) items
  )
  select
    (select count(*)::integer from thread_activity) as thread_count,
    (select count(*)::integer from reply_activity) as reply_count,
    coalesce((select array_agg(category_name) from category_counts), '{}') as top_categories,
    coalesce((select payload from recent_items), '[]'::jsonb) as recent_contributions;
$$;

revoke all on function public.list_forum_categories() from public;
grant execute on function public.list_forum_categories() to anon, authenticated;

revoke all on function public.list_forum_threads(text, integer) from public;
grant execute on function public.list_forum_threads(text, integer) to anon, authenticated;

revoke all on function public.get_forum_thread(text) from public;
grant execute on function public.get_forum_thread(text) to anon, authenticated;

revoke all on function public.create_forum_topic(text, text, text) from public;
grant execute on function public.create_forum_topic(text, text, text) to authenticated;

revoke all on function public.create_forum_reply(text, text, uuid) from public;
grant execute on function public.create_forum_reply(text, text, uuid) to authenticated;

revoke all on function public.get_public_member_profile(uuid) from public;
grant execute on function public.get_public_member_profile(uuid) to anon, authenticated;

revoke all on function public.get_profile_forum_activity(uuid) from public;
grant execute on function public.get_profile_forum_activity(uuid) to anon, authenticated;

do $$
declare
  topic_record record;
begin
  for topic_record in
    select forum_topics.id
    from public.forum_topics
  loop
    perform public.refresh_forum_topic_metrics(topic_record.id);
  end loop;
end;
$$;
