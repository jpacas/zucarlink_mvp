-- Fix: create_forum_topic could raise a unique_violation on forum_topics.slug
-- (surfaced to the client as an HTTP 409) if two topics with the same title
-- are submitted concurrently — build_unique_forum_slug's existence check and
-- the later insert are not atomic. Retry with a freshly computed slug a
-- couple of times instead of letting the conflict bubble up.
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
  candidate_slug text;
  attempts_left integer := 3;
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

  loop
    candidate_slug := public.build_unique_forum_slug(trim(title_text));

    begin
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
        candidate_slug,
        trim(body_text),
        'published',
        0,
        timezone('utc', now())
      )
      returning id into created_topic_id;

      exit;
    exception when unique_violation then
      attempts_left := attempts_left - 1;
      if attempts_left <= 0 then
        raise;
      end if;
    end;
  end loop;

  return query select candidate_slug;
end;
$$;
