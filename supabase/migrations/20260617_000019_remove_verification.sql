-- Elimina la funcionalidad de verificación de perfiles del sitio.
-- Se descartan las RPCs de la cola de verificación del panel admin. La columna
-- profiles.verification_status se conserva en la base de datos (otras RPCs aún la
-- devuelven sin que el frontend la consuma), igual que el enfoque usado al
-- retirar la verificación del directorio.
-- El helper public.is_admin() NO se elimina: lo usan otras funciones.

drop function if exists public.admin_list_pending_verifications();
drop function if exists public.admin_update_verification(uuid, text);
