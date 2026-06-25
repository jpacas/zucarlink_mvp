-- Avatares: hacer el bucket público para que las fotos de perfil de todos los
-- miembros se vean (incluido el foro público para visitantes anónimos) y se
-- sirvan con URLs estables cacheables por CDN + transformaciones de tamaño.
-- Las escrituras siguen acotadas al dueño de la carpeta.

update storage.buckets set public = true where id = 'avatars';

drop policy if exists avatars_select_own on storage.objects;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
on storage.objects
for select
using (bucket_id = 'avatars');
