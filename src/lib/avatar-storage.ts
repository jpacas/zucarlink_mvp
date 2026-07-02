import { getSupabaseBrowserClient, getSupabaseClientOrThrow } from './supabase'
import { downscaleImage } from './image-downscale'
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
  const client = getSupabaseClientOrThrow()

  validateAvatarFile(params.file)

  // Redimensionamos/comprimimos en el cliente antes de subir: el servidor no aplica
  // transformaciones (plan sin esa función), así evitamos servir originales pesados.
  const { blob, extension, contentType } = await downscaleImage(params.file, AVATAR_OUTPUT_MAX_SIZE)
  const path = `${params.userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, {
      // Las rutas son inmutables (nombre con UUID), así que cacheamos por 1 año.
      cacheControl: '31536000',
      contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return { path }
}

export async function removeAvatar(path: string) {
  const client = getSupabaseClientOrThrow()

  const { error } = await client.storage.from(AVATAR_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
  }
}

// El bucket de avatares es público: devolvemos una URL pública estable (cacheable
// por CDN, sin re-firmar en cada render). No usamos transformaciones de imagen del
// servidor porque son una función de plan de pago (no habilitada en este proyecto);
// en su lugar las fotos se redimensionan en el cliente al subir (ver downscaleImage).
export function getAvatarPublicUrl(path: string): string | null {
  const client = getSupabaseBrowserClient()

  if (!client) {
    return null
  }

  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path)

  return data.publicUrl
}

const AVATAR_OUTPUT_MAX_SIZE = 256
