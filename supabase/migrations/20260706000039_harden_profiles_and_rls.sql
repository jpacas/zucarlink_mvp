-- Endurecimiento de seguridad (auditoría /cso comprehensive, 2026-07-06)
-- Cubre 3 hallazgos de autorización a nivel de base de datos:
--   #2 (MEDIA)  Auto-verificación de perfil: un usuario podía fijar su propio
--              verification_status='verified' y account_type por UPDATE directo.
--   #8 (BAJA)   forum_topic_likes exponía user_id de los likers a anon.
--   #9 (BAJA)   companies permitía INSERT arbitrario a cualquier autenticado.

-- ---------------------------------------------------------------------------
-- #2. Proteger columnas privilegiadas de profiles (verification_status,
--     account_type) frente a modificaciones directas de usuarios no-admin.
--
-- La política profiles_update_own permite al dueño actualizar su fila, pero sin
-- restricción por columna. Este trigger BEFORE UPDATE revierte cambios a las
-- columnas privilegiadas salvo que el llamante sea admin (public.is_admin(),
-- fuente de verdad en app_metadata) o el service_role (edge functions / scripts
-- de seed y migración legítimos). El flujo de negocio para verificar perfiles
-- sigue siendo admin_update_verification (SECURITY DEFINER), que ejecuta con el
-- JWT del admin y por tanto pasa el guard.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
     or new.account_type is distinct from old.account_type then
    if not public.is_admin()
       and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      new.verification_status := old.verification_status;
      new.account_type := old.account_type;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- #8. Dejar de exponer user_id de los likers. El frontend solo usa los RPC
--     get_forum_topic_like_state / toggle_forum_topic_like (SECURITY DEFINER),
--     así que no necesita SELECT directo sobre la tabla. Se elimina la política
--     de lectura pública; con RLS activo y sin política, el acceso directo queda
--     denegado (los RPC siguen funcionando por ser SECURITY DEFINER).
-- ---------------------------------------------------------------------------
drop policy if exists forum_topic_likes_public_read on public.forum_topic_likes;

-- ---------------------------------------------------------------------------
-- #9. Eliminar el INSERT directo arbitrario en companies. Toda creación de
--     empresas pasa por el RPC public.upsert_company (SECURITY DEFINER, que
--     normaliza el nombre), de modo que la política directa era innecesaria y
--     permitía spam de filas por cualquier usuario autenticado.
-- ---------------------------------------------------------------------------
drop policy if exists companies_authenticated_insert on public.companies;
