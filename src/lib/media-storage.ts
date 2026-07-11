import { getSupabaseBrowserClient, getSupabaseClientOrThrow } from './supabase'
import { downscaleImage } from './image-downscale'
import { logAttachmentCleanupFailure } from './attachment-cleanup-log'
import {
  FORUM_MEDIA_BUCKET,
  MEDIA_DOCUMENT_ALLOWED_TYPES,
  MEDIA_DOCUMENT_MAX_BYTES,
  MEDIA_IMAGE_ALLOWED_TYPES,
  MEDIA_IMAGE_MAX_BYTES,
  MEDIA_VIDEO_ALLOWED_TYPES,
  MEDIA_VIDEO_MAX_BYTES,
  MESSAGE_MEDIA_BUCKET,
  type MediaAttachmentType,
  type MediaUploadResult,
} from '../types/storage'

const MEDIA_IMAGE_OUTPUT_MAX_SIZE = 1600

const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const DOCUMENT_TYPE_BY_MIME: Record<string, Extract<MediaAttachmentType, 'pdf' | 'word' | 'excel'>> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
}

const DOCUMENT_EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

export function classifyMediaFile(file: File): MediaAttachmentType | null {
  if (MEDIA_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_IMAGE_ALLOWED_TYPES)[number])) {
    return 'image'
  }
  if (MEDIA_VIDEO_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_VIDEO_ALLOWED_TYPES)[number])) {
    return 'video'
  }
  if (MEDIA_DOCUMENT_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_DOCUMENT_ALLOWED_TYPES)[number])) {
    return DOCUMENT_TYPE_BY_MIME[file.type] ?? null
  }
  return null
}

export function validateMediaFile(file: File): MediaAttachmentType {
  const type = classifyMediaFile(file)

  if (!type) {
    throw new Error('Formato no permitido. Usa JPEG, PNG, WEBP, MP4, WEBM, MOV, PDF, DOCX o XLSX.')
  }

  if (type === 'image' && file.size > MEDIA_IMAGE_MAX_BYTES) {
    throw new Error('La imagen excede el máximo permitido de 10 MB.')
  }

  if (type === 'video' && file.size > MEDIA_VIDEO_MAX_BYTES) {
    throw new Error('El video excede el máximo permitido de 50 MB.')
  }

  if ((type === 'pdf' || type === 'word' || type === 'excel') && file.size > MEDIA_DOCUMENT_MAX_BYTES) {
    throw new Error('El documento excede el máximo permitido de 20 MB.')
  }

  return type
}

async function buildObjectForUpload(file: File): Promise<{
  blob: Blob
  extension: string
  contentType: string
  type: MediaAttachmentType
}> {
  const type = validateMediaFile(file)

  if (type === 'image') {
    // Redimensionamos/comprimimos en el cliente: el servidor no aplica transformaciones
    // (función de plan de pago no habilitada), igual que avatares y logos.
    try {
      const { blob, extension, contentType } = await downscaleImage(file, MEDIA_IMAGE_OUTPUT_MAX_SIZE)
      return { blob, extension, contentType, type }
    } catch {
      // Algunos JPEG (p.ej. CMYK de bancos de imágenes) hacen fallar
      // createImageBitmap ("InvalidStateError: The source image could not be
      // decoded") aunque el navegador sí puede mostrarlos vía <img>. Subimos el
      // archivo original sin redimensionar en vez de bloquear el adjunto.
      const extension = IMAGE_EXTENSION_BY_MIME[file.type] ?? 'jpg'
      return { blob: file, extension, contentType: file.type, type }
    }
  }

  if (type === 'video') {
    // Video: se sube tal cual, sin transcodificación.
    const extension = VIDEO_EXTENSION_BY_MIME[file.type] ?? 'mp4'
    return { blob: file, extension, contentType: file.type, type }
  }

  // Documento (pdf/word/excel): se sube tal cual, sin transformación.
  const extension = DOCUMENT_EXTENSION_BY_MIME[file.type] ?? 'pdf'
  return { blob: file, extension, contentType: file.type, type }
}

export async function uploadForumAttachment(params: {
  file: File
  userId: string
}): Promise<MediaUploadResult> {
  const client = getSupabaseClientOrThrow()
  const { blob, extension, contentType, type } = await buildObjectForUpload(params.file)
  const path = `${params.userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from(FORUM_MEDIA_BUCKET)
    .upload(path, blob, { cacheControl: '31536000', contentType, upsert: false })

  if (error) {
    throw new Error(error.message)
  }

  return { path, type, filename: params.file.name.slice(0, 255), sizeBytes: blob.size }
}

export async function removeForumAttachment(path: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.storage.from(FORUM_MEDIA_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
  }
}

// Borrado en batch de adjuntos que quedaron huérfanos tras eliminar un tema/respuesta
// (la fila en DB ya fue borrada exitosamente, así que un fallo aquí no debe bloquear
// la UX — el llamador debe loguearlo con logAttachmentCleanupFailure).
export async function removeOrphanedForumAttachments(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const client = getSupabaseClientOrThrow()
  const { error } = await client.storage.from(FORUM_MEDIA_BUCKET).remove(paths)

  if (error) {
    throw new Error(error.message)
  }
}

// Sube hasta 6 archivos secuencialmente (no en paralelo, para poder revertir
// limpiamente los que ya subieron si uno falla en el medio).
export async function uploadForumAttachments(params: {
  files: File[]
  userId: string
}): Promise<MediaUploadResult[]> {
  if (params.files.length > 6) {
    throw new Error('Máximo 6 archivos por publicación.')
  }

  const results: MediaUploadResult[] = []
  try {
    for (const file of params.files) {
      results.push(await uploadForumAttachment({ file, userId: params.userId }))
    }
    return results
  } catch (error) {
    const paths = results.map((r) => r.path)
    if (paths.length > 0) {
      await removeOrphanedForumAttachments(paths).catch((cause) =>
        logAttachmentCleanupFailure({ path: paths, bucket: 'forum-media', cause }),
      )
    }
    throw error
  }
}

// Bucket público: URL directa y estable (igual que getAvatarPublicUrl).
export function getForumAttachmentPublicUrl(path: string): string | null {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data } = client.storage.from(FORUM_MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadMessageAttachment(params: {
  file: File
  conversationId: string
  senderId: string
}): Promise<MediaUploadResult> {
  const client = getSupabaseClientOrThrow()
  const { blob, extension, contentType, type } = await buildObjectForUpload(params.file)
  const path = `${params.conversationId}/${params.senderId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from(MESSAGE_MEDIA_BUCKET)
    .upload(path, blob, { cacheControl: '3600', contentType, upsert: false })

  if (error) {
    throw new Error(error.message)
  }

  return { path, type, filename: params.file.name.slice(0, 255), sizeBytes: blob.size }
}

export async function removeMessageAttachment(path: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.storage.from(MESSAGE_MEDIA_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
  }
}

// Borrado en batch (mismo patrón que removeOrphanedForumAttachments).
export async function removeOrphanedMessageAttachments(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const client = getSupabaseClientOrThrow()
  const { error } = await client.storage.from(MESSAGE_MEDIA_BUCKET).remove(paths)

  if (error) {
    throw new Error(error.message)
  }
}

// Sube hasta 6 archivos secuencialmente (no en paralelo, para poder revertir
// limpiamente los que ya subieron si uno falla en el medio).
export async function uploadMessageAttachments(params: {
  files: File[]
  conversationId: string
  senderId: string
}): Promise<MediaUploadResult[]> {
  if (params.files.length > 6) {
    throw new Error('Máximo 6 archivos por mensaje.')
  }

  const results: MediaUploadResult[] = []
  try {
    for (const file of params.files) {
      results.push(
        await uploadMessageAttachment({
          file,
          conversationId: params.conversationId,
          senderId: params.senderId,
        }),
      )
    }
    return results
  } catch (error) {
    const paths = results.map((r) => r.path)
    if (paths.length > 0) {
      await removeOrphanedMessageAttachments(paths).catch((cause) =>
        logAttachmentCleanupFailure({ path: paths, bucket: 'message-media', cause }),
      )
    }
    throw error
  }
}

// Bucket privado: requiere URL firmada por request (no cacheable a largo plazo).
// 1h alcanza para ver la conversación abierta; se re-firma en cada carga de
// getThreadMessages.
export async function getMessageAttachmentSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client.storage
    .from(MESSAGE_MEDIA_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) return null
  return data.signedUrl
}
