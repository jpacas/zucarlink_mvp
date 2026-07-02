import { getSupabaseBrowserClient, getSupabaseClientOrThrow } from './supabase'
import { downscaleImage } from './image-downscale'
import {
  LOGO_ALLOWED_TYPES,
  LOGO_BUCKET,
  LOGO_MAX_BYTES,
  type LogoUploadResult,
} from '../types/storage'

const LOGO_OUTPUT_MAX_SIZE = 512

export function validateLogoFile(file: File) {
  if (!LOGO_ALLOWED_TYPES.includes(file.type as (typeof LOGO_ALLOWED_TYPES)[number])) {
    throw new Error('Formato no permitido. Usa JPEG, PNG o WEBP.')
  }

  if (file.size > LOGO_MAX_BYTES) {
    throw new Error('El archivo excede el máximo permitido de 2 MB.')
  }
}

export async function uploadProviderLogo(params: {
  file: File
  userId: string
}): Promise<LogoUploadResult> {
  const client = getSupabaseClientOrThrow()

  validateLogoFile(params.file)

  // Comprimimos en el cliente (ver image-downscale) antes de subir.
  const { blob, extension, contentType } = await downscaleImage(params.file, LOGO_OUTPUT_MAX_SIZE)
  const path = `${params.userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from(LOGO_BUCKET)
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

export async function removeLogo(path: string) {
  const client = getSupabaseClientOrThrow()

  const { error } = await client.storage.from(LOGO_BUCKET).remove([path])

  if (error) {
    throw new Error(error.message)
  }
}

// El bucket de logos es público: devolvemos una URL pública estable (cacheable por
// CDN) que se guarda directamente en providers.logo_url y consumen las RPCs públicas.
export function getLogoPublicUrl(path: string): string | null {
  const client = getSupabaseBrowserClient()

  if (!client) {
    return null
  }

  const { data } = client.storage.from(LOGO_BUCKET).getPublicUrl(path)

  return data.publicUrl
}
