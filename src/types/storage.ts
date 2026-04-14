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
