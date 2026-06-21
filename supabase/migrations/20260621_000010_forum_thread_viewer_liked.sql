-- Expone si el usuario actual ya dio like a cada tema, para acciones directas
-- desde el listado del foro (like/unlike sin entrar al hilo).
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
