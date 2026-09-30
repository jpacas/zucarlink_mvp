-- T19: reputación/gamificación — contador incremental O(1), nunca un
-- recálculo sobre el historial completo (Section 7 del eng review, riesgo
-- #14 del Failure Modes Registry: un trigger síncrono mal hecho puede
-- bloquear o fallar la respuesta/like que lo dispara). Por eso ambos
-- triggers van en un bloque BEGIN/EXCEPTION que absorbe cualquier error y
-- solo deja un WARNING en el log — nunca revierte el INSERT real del
-- usuario por un fallo en el contador de reputación.
--
-- Quién gana puntos: postear una respuesta suma para quien la escribe;
-- recibir un like en tu tema suma para el autor del tema (no para quien
-- da el like).

alter table public.profiles
  add column if not exists reputation_points integer not null default 0;

create index if not exists profiles_reputation_points_idx
  on public.profiles (reputation_points desc);

create or replace function public.bump_reputation_on_forum_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set reputation_points = reputation_points + 1
  where id = new.author_id;

  return new;
exception
  when others then
    raise warning 'bump_reputation_on_forum_reply failed for reply %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists forum_replies_bump_reputation on public.forum_replies;
create trigger forum_replies_bump_reputation
  after insert on public.forum_replies
  for each row
  execute function public.bump_reputation_on_forum_reply();

create or replace function public.bump_reputation_on_topic_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id
  from public.forum_topics
  where id = new.topic_id;

  if v_author_id is not null then
    update public.profiles
    set reputation_points = reputation_points + 1
    where id = v_author_id;
  end if;

  return new;
exception
  when others then
    raise warning 'bump_reputation_on_topic_like failed for topic %: %', new.topic_id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists forum_topic_likes_bump_reputation on public.forum_topic_likes;
create trigger forum_topic_likes_bump_reputation
  after insert on public.forum_topic_likes
  for each row
  execute function public.bump_reputation_on_topic_like();

-- Expone reputation_points en la ficha pública del perfil. CREATE OR REPLACE
-- no puede cambiar las columnas de retorno (SQLSTATE 42P13) — hay que
-- dropear primero, mismo patrón que el fix de 20260715000050.
drop function if exists public.get_public_member_profile(uuid);

create function public.get_public_member_profile(profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_path text,
  role_title text,
  organization_name text,
  country text,
  short_bio text,
  specialties text[],
  verification_status text,
  reputation_points integer
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
    coalesce(
      (
        select array_agg(sp.name order by sp.name)
        from public.profile_specialties ps
        join public.specialties sp on sp.id = ps.specialty_id
        where ps.profile_id = profiles.id
      ),
      '{}'::text[]
    ) as specialties,
    profiles.verification_status,
    profiles.reputation_points
  from public.profiles
  left join public.companies on companies.id = profiles.current_company_id
  where profiles.id = profile_id
    and profiles.account_type = 'technician'
    and profiles.profile_status = 'complete'
    and profiles.public_listing_opt_out = false
    and profiles.is_demo = false;
$$;

revoke all on function public.get_public_member_profile(uuid) from public;
grant execute on function public.get_public_member_profile(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
