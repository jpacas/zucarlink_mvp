-- Riesgo aceptado (no-op, solo trazabilidad): validateMediaFile en el cliente
-- (src/lib/media-storage.ts) limita imágenes a 10 MB, pero el file_size_limit de
-- los buckets forum-media/message-media es 50 MB para ambos tipos (imagen y video),
-- ya que Supabase Storage no soporta límites diferenciados por MIME type dentro de
-- un mismo bucket.
--
-- Opciones descartadas:
--   - Trigger BEFORE INSERT en storage.objects: el archivo ya se sube físicamente
--     antes de poder rechazarlo, generando huérfanos.
--   - Separar en 2 buckets por tipo: migración costosa de objetos ya en producción,
--     sin beneficio proporcional.
--
-- Se acepta el riesgo: no hay transcodificación server-side, así que una imagen de
-- hasta 50 MB no representa riesgo de seguridad, solo consumo de cuota de Storage.
-- La validación de 10 MB en cliente cubre el caso normal de uso.

comment on column public.forum_topics.attachment_size_bytes is
  'Peso del blob subido. El límite de 10MB para imágenes solo se aplica en cliente (validateMediaFile); el bucket forum-media permite hasta 50MB para ambos tipos (riesgo aceptado, ver 20260711000047).';

comment on column public.forum_replies.attachment_size_bytes is
  'Peso del blob subido. El límite de 10MB para imágenes solo se aplica en cliente (validateMediaFile); el bucket forum-media permite hasta 50MB para ambos tipos (riesgo aceptado, ver 20260711000047).';

comment on column public.messages.attachment_size_bytes is
  'Peso del blob subido. El límite de 10MB para imágenes solo se aplica en cliente (validateMediaFile); el bucket message-media permite hasta 50MB para ambos tipos (riesgo aceptado, ver 20260711000047).';
