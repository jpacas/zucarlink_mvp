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

  // Redimensionamos/comprimimos en el cliente antes de subir: el servidor no aplica
  // transformaciones (plan sin esa función), así evitamos servir originales pesados.
  const { blob, extension, contentType } = await downscaleImage(params.file)
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

interface DownscaledImage {
  blob: Blob
  extension: 'webp' | 'jpg'
  contentType: 'image/webp' | 'image/jpeg'
}

// Redimensiona la imagen a un máximo de 256px (lado mayor) manteniendo proporción y
// la comprime a WEBP (con fallback a JPEG). El recorte cuadrado lo hace el CSS al
// mostrar el avatar, así que aquí solo escalamos.
async function downscaleImage(file: File): Promise<DownscaledImage> {
  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(
      1,
      AVATAR_OUTPUT_MAX_SIZE / Math.max(bitmap.width, bitmap.height),
    )
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('No fue posible procesar la imagen.')
    }

    context.drawImage(bitmap, 0, 0, width, height)

    const webp = await canvasToBlob(canvas, 'image/webp')

    if (webp) {
      return { blob: webp, extension: 'webp', contentType: 'image/webp' }
    }

    const jpeg = await canvasToBlob(canvas, 'image/jpeg')

    if (jpeg) {
      return { blob: jpeg, extension: 'jpg', contentType: 'image/jpeg' }
    }

    throw new Error('No fue posible procesar la imagen.')
  } finally {
    bitmap.close()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, 0.8)
  })
}
