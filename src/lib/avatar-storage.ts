import { getSupabaseBrowserClient } from './supabase'
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  type AvatarUploadResult,
} from '../types/storage'

export function validateAvatarFile(file: File) {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
    throw new Error('Formato no permitido. Usa JPEG, PNG o WEBP.')
  }

  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('El archivo excede el máximo permitido de 5 MB.')
  }
}

export async function uploadAvatar(params: {
  file: File
  userId: string
}): Promise<AvatarUploadResult> {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  validateAvatarFile(params.file)

  const extension = getFileExtension(params.file)
  const path = `${params.userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, params.file, {
      // Las rutas son inmutables (nombre con UUID), así que cacheamos por 1 año.
      cacheControl: '31536000',
      contentType: params.file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return { path }
}

export async function removeAvatar(path: string) {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  const { error } = await client.storage.from(AVATAR_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
  }
}

// El bucket de avatares es público: devolvemos una URL pública estable (cacheable
// por CDN, sin re-firmar en cada render) y pedimos un render redimensionado para
// que las fotos de perfil pesen pocos KB. 176px cubre el avatar más grande (88px @2×).
export function getAvatarPublicUrl(path: string, size = 176): string | null {
  const client = getSupabaseBrowserClient()

  if (!client) {
    return null
  }

  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path, {
    transform: {
      width: size,
      height: size,
      resize: 'cover',
      quality: 80,
    },
  })

  return data.publicUrl
}

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()

  if (fromName && fromName.length <= 5) {
    return fromName
  }

  switch (file.type) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}
