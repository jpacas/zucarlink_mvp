import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseAuthFake } from '../test/fakes/supabase'
import * as supabaseModule from './supabase'
import {
  classifyMediaFile,
  getMessageAttachmentSignedUrl,
  uploadForumAttachment,
  uploadMessageAttachment,
  validateMediaFile,
} from './media-storage'

function stubSupabaseClient(supabase: ReturnType<typeof createSupabaseAuthFake>) {
  vi.spyOn(supabaseModule, 'getSupabaseBrowserClient').mockImplementation(() => supabase as never)
  vi.spyOn(supabaseModule, 'getSupabaseClientOrThrow').mockImplementation(() => supabase as never)
}

function fileOfSize(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type })
}

describe('validateMediaFile / classifyMediaFile', () => {
  it('acepta imágenes y videos con formatos permitidos', () => {
    expect(classifyMediaFile(fileOfSize('a.jpg', 'image/jpeg', 10))).toBe('image')
    expect(classifyMediaFile(fileOfSize('a.png', 'image/png', 10))).toBe('image')
    expect(classifyMediaFile(fileOfSize('a.webp', 'image/webp', 10))).toBe('image')
    expect(classifyMediaFile(fileOfSize('a.mp4', 'video/mp4', 10))).toBe('video')
    expect(classifyMediaFile(fileOfSize('a.webm', 'video/webm', 10))).toBe('video')
    expect(classifyMediaFile(fileOfSize('a.mov', 'video/quicktime', 10))).toBe('video')
  })

  it('rechaza un formato no soportado', () => {
    expect(classifyMediaFile(fileOfSize('a.gif', 'image/gif', 10))).toBeNull()
    expect(() => validateMediaFile(fileOfSize('a.gif', 'image/gif', 10))).toThrow(
      'Formato no permitido. Usa JPEG, PNG, WEBP, MP4, WEBM o MOV.',
    )
  })

  it('rechaza una imagen que excede 10 MB', () => {
    const oversized = fileOfSize('a.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1)
    expect(() => validateMediaFile(oversized)).toThrow(
      'La imagen excede el máximo permitido de 10 MB.',
    )
  })

  it('rechaza un video que excede 50 MB', () => {
    const oversized = fileOfSize('a.mp4', 'video/mp4', 50 * 1024 * 1024 + 1)
    expect(() => validateMediaFile(oversized)).toThrow(
      'El video excede el máximo permitido de 50 MB.',
    )
  })
})

describe('uploadForumAttachment', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback) {
      callback(new Blob(['imagen'], { type: 'image/webp' }))
    }
  })

  it('sube una imagen redimensionada al bucket forum-media con path {userId}/{uuid}.webp', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)
    const fromSpy = vi.spyOn(supabase.storage, 'from')

    const result = await uploadForumAttachment({
      file: fileOfSize('foto.jpg', 'image/jpeg', 1024),
      userId: 'user-1',
    })

    expect(fromSpy).toHaveBeenCalledWith('forum-media')
    expect(result.type).toBe('image')
    expect(result.path).toMatch(/^user-1\/[0-9a-f-]{36}\.webp$/)
  })

  it('sube un video tal cual, sin transcodificar, con extensión mapeada', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)
    const fromSpy = vi.spyOn(supabase.storage, 'from')

    const result = await uploadForumAttachment({
      file: fileOfSize('clip.mov', 'video/quicktime', 2048),
      userId: 'user-2',
    })

    expect(fromSpy).toHaveBeenCalledWith('forum-media')
    expect(result.type).toBe('video')
    expect(result.path).toMatch(/^user-2\/[0-9a-f-]{36}\.mov$/)
  })
})

describe('uploadMessageAttachment', () => {
  it('sube al bucket message-media con path {conversationId}/{senderId}/{uuid}.{ext}', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)
    const fromSpy = vi.spyOn(supabase.storage, 'from')

    const result = await uploadMessageAttachment({
      file: fileOfSize('clip.webm', 'video/webm', 2048),
      conversationId: 'conv-1',
      senderId: 'user-3',
    })

    expect(fromSpy).toHaveBeenCalledWith('message-media')
    expect(result.path).toMatch(/^conv-1\/user-3\/[0-9a-f-]{36}\.webm$/)
  })
})

describe('getMessageAttachmentSignedUrl', () => {
  it('devuelve la URL firmada simulada por el fake', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)

    const url = await getMessageAttachmentSignedUrl('conv-1/user-3/file.webp', 1800)

    expect(url).toBe('https://signed.example/conv-1/user-3/file.webp?expiresIn=1800')
  })
})
