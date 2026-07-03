import { getSupabaseBrowserClient, getSupabaseClientOrThrow } from './supabase'
import { downscaleImage } from './image-downscale'
import {
  FORUM_MEDIA_BUCKET,
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

export function classifyMediaFile(file: File): MediaAttachmentType | null {
  if (MEDIA_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_IMAGE_ALLOWED_TYPES)[number])) {
    return 'image'
  }
  if (MEDIA_VIDEO_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_VIDEO_ALLOWED_TYPES)[number])) {
    return 'video'
  }
  return null
}

export function validateMediaFile(file: File): MediaAttachmentType {
  const type = classifyMediaFile(file)

  if (!type) {
    throw new Error('Formato no permitido. Usa JPEG, PNG, WEBP, MP4, WEBM o MOV.')
  }

  if (type === 'image' && file.size > MEDIA_IMAGE_MAX_BYTES) {
    throw new Error('La imagen excede el máximo permitido de 10 MB.')
  }

  if (type === 'video' && file.size > MEDIA_VIDEO_MAX_BYTES) {
    throw new Error('El video excede el máximo permitido de 50 MB.')
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
    const { blob, extension, contentType } = await downscaleImage(file, MEDIA_IMAGE_OUTPUT_MAX_SIZE)
    return { blob, extension, contentType, type }
  }

  // Video: se sube tal cual, sin transcodificación.
  const extension = VIDEO_EXTENSION_BY_MIME[file.type] ?? 'mp4'
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

  return { path, type }
}

export async function removeForumAttachment(path: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.storage.from(FORUM_MEDIA_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
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

  return { path, type }
}

export async function removeMessageAttachment(path: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.storage.from(MESSAGE_MEDIA_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
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
