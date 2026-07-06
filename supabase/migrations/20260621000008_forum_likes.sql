create table if not exists public.forum_topic_likes (
  topic_id uuid not null references public.forum_topics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (topic_id, user_id)
);

create index if not exists forum_topic_likes_topic_id_idx
  on public.forum_topic_likes (topic_id);

alter table public.forum_topic_likes enable row level security;

drop policy if exists forum_topic_likes_public_read on public.forum_topic_likes;
create policy forum_topic_likes_public_read
on public.forum_topic_likes
for select
using (true);

create or replace function public.get_forum_topic_like_state(thread_slug text)
returns table (like_count integer, viewer_liked boolean)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)::integer
      from public.forum_topic_likes likes
      join public.forum_topics topics on topics.id = likes.topic_id
      where topics.slug = trim(thread_slug)
    ) as like_count,
    exists (
      select 1
      from public.forum_topic_likes likes
      join public.forum_topics topics on topics.id = likes.topic_id
      where topics.slug = trim(thread_slug)
        and likes.user_id = auth.uid()
    ) as viewer_liked;
$$;

create or replace function public.toggle_forum_topic_like(thread_slug text)
returns table (like_count integer, viewer_liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_topic_id uuid;
  already_liked boolean;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para reaccionar.';
  end if;

  select forum_topics.id
  into target_topic_id
  from public.forum_topics
  where forum_topics.slug = trim(thread_slug)
    and forum_topics.status = 'published';

  if target_topic_id is null then
    raise exception 'El tema no existe.';
  end if;

  select exists (
    select 1
    from public.forum_topic_likes
    where forum_topic_likes.topic_id = target_topic_id
      and forum_topic_likes.user_id = auth.uid()
  )
  into already_liked;

  if already_liked then
    delete from public.forum_topic_likes
    where forum_topic_likes.topic_id = target_topic_id
      and forum_topic_likes.user_id = auth.uid();
  else
    insert into public.forum_topic_likes (topic_id, user_id)
    values (target_topic_id, auth.uid())
    on conflict do nothing;
  end if;

  return query
    select
      (
        select count(*)::integer
        from public.forum_topic_likes
        where forum_topic_likes.topic_id = target_topic_id
      ),
      exists (
        select 1
        from public.forum_topic_likes
        where forum_topic_likes.topic_id = target_topic_id
          and forum_topic_likes.user_id = auth.uid()
      );
end;
$$;

revoke all on function public.get_forum_topic_like_state(text) from public;
grant execute on function public.get_forum_topic_like_state(text) to anon, authenticated;

revoke all on function public.toggle_forum_topic_like(text) from public;
grant execute on function public.toggle_forum_topic_like(text) to authenticated;
