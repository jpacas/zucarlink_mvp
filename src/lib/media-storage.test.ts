import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseAuthFake } from '../test/fakes/supabase'
import * as supabaseModule from './supabase'
import {
  classifyMediaFile,
  getMessageAttachmentSignedUrl,
  uploadForumAttachment,
  uploadForumAttachments,
  uploadMessageAttachment,
  uploadMessageAttachments,
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

  it('acepta PDF, docx y xlsx', () => {
    expect(classifyMediaFile(fileOfSize('a.pdf', 'application/pdf', 10))).toBe('pdf')
    expect(
      classifyMediaFile(
        fileOfSize(
          'a.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          10,
        ),
      ),
    ).toBe('word')
    expect(
      classifyMediaFile(
        fileOfSize(
          'a.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          10,
        ),
      ),
    ).toBe('excel')
  })

  it('rechaza un formato no soportado', () => {
    expect(classifyMediaFile(fileOfSize('a.gif', 'image/gif', 10))).toBeNull()
    expect(() => validateMediaFile(fileOfSize('a.gif', 'image/gif', 10))).toThrow(
      'Formato no permitido. Usa JPEG, PNG, WEBP, MP4, WEBM, MOV, PDF, DOCX o XLSX.',
    )
  })

  it('rechaza formatos legacy/macro-enabled de Office (.doc, .xlsm)', () => {
    expect(classifyMediaFile(fileOfSize('a.doc', 'application/msword', 10))).toBeNull()
    expect(
      classifyMediaFile(fileOfSize('a.xlsm', 'application/vnd.ms-excel.sheet.macroEnabled.12', 10)),
    ).toBeNull()
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

  it('rechaza un documento que excede 20 MB', () => {
    const oversized = fileOfSize('a.pdf', 'application/pdf', 20 * 1024 * 1024 + 1)
    expect(() => validateMediaFile(oversized)).toThrow(
      'El documento excede el máximo permitido de 20 MB.',
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

describe('uploadForumAttachments / uploadMessageAttachments', () => {
  it('rechaza más de 6 archivos', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)

    const files = Array.from({ length: 7 }, (_, i) => fileOfSize(`f${i}.pdf`, 'application/pdf', 10))

    await expect(uploadForumAttachments({ files, userId: 'user-1' })).rejects.toThrow(
      'Máximo 6 archivos por publicación.',
    )
    await expect(
      uploadMessageAttachments({ files, conversationId: 'conv-1', senderId: 'user-1' }),
    ).rejects.toThrow('Máximo 6 archivos por mensaje.')
  })

  it('sube varios archivos válidos y devuelve un resultado por cada uno', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)

    const files = [
      fileOfSize('a.pdf', 'application/pdf', 10),
      fileOfSize('b.pdf', 'application/pdf', 10),
    ]

    const results = await uploadForumAttachments({ files, userId: 'user-1' })
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.type === 'pdf')).toBe(true)
  })

  it('revierte (borra) los archivos ya subidos si uno del lote falla', async () => {
    const supabase = createSupabaseAuthFake()
    stubSupabaseClient(supabase)

    // storage.from() devuelve un objeto nuevo por llamada, así que se intercepta
    // la factory para registrar cada invocación de `remove` sin importar la instancia.
    const removeCalls: string[][] = []
    const originalFrom = supabase.storage.from.bind(supabase.storage)
    vi.spyOn(supabase.storage, 'from').mockImplementation((bucket: string) => {
      const original = originalFrom(bucket)
      return {
        ...original,
        remove: async (paths: string[]) => {
          removeCalls.push(paths)
          return original.remove(paths)
        },
      }
    })

    const badFile = fileOfSize('bad.exe', 'application/x-msdownload', 10)
    const files = [fileOfSize('a.pdf', 'application/pdf', 10), badFile]

    await expect(uploadForumAttachments({ files, userId: 'user-1' })).rejects.toThrow()
    expect(removeCalls.length).toBeGreaterThan(0)
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
