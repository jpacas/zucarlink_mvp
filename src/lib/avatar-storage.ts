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
      cacheControl: '3600',
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

export async function createAvatarSignedUrl(path: string, expiresIn = 3600) {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  const { data, error } = await client.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(error.message)
  }

  return data.signedUrl
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
