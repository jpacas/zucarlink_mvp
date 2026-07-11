export const AVATAR_BUCKET = 'avatars'
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AvatarMimeType = (typeof AVATAR_ALLOWED_TYPES)[number]

export interface AvatarUploadResult {
  path: string
}

export const LOGO_BUCKET = 'provider-logos'
export const LOGO_MAX_BYTES = 2 * 1024 * 1024
export const LOGO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type LogoMimeType = (typeof LOGO_ALLOWED_TYPES)[number]

export interface LogoUploadResult {
  path: string
}

export const FORUM_MEDIA_BUCKET = 'forum-media'
export const MESSAGE_MEDIA_BUCKET = 'message-media'

export const MEDIA_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_VIDEO_MAX_BYTES = 50 * 1024 * 1024

export const MEDIA_IMAGE_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MEDIA_VIDEO_ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const

export const MEDIA_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024

// Solo Office moderno (Open XML) y PDF. Se excluyen deliberadamente los
// formatos legacy/macro-enabled (.doc, .xls, .docm, .xlsm) por riesgo de
// seguridad — ver revisión de seguridad en el plan de adjuntos múltiples.
export const MEDIA_DOCUMENT_ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

export type MediaImageMimeType = (typeof MEDIA_IMAGE_ALLOWED_TYPES)[number]
export type MediaVideoMimeType = (typeof MEDIA_VIDEO_ALLOWED_TYPES)[number]
export type MediaDocumentMimeType = (typeof MEDIA_DOCUMENT_ALLOWED_TYPES)[number]
export type MediaAttachmentType = 'image' | 'video' | 'pdf' | 'word' | 'excel'

export const MAX_ATTACHMENTS_PER_MESSAGE = 6

export interface MediaUploadResult {
  path: string
  type: MediaAttachmentType
  filename: string
  sizeBytes: number
}
