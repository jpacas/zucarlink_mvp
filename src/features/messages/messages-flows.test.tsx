import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, expect, it, vi } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

// jsdom no implementa scrollIntoView; MessagesPage lo llama al actualizar los mensajes.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

function stubImageDownscale() {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback) {
    callback(new Blob(['imagen'], { type: 'image/webp' }))
  }
  return () => {
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    vi.unstubAllGlobals()
  }
}

// `.storage.from(bucket)` del fake devuelve un objeto nuevo en cada llamada; envolvemos
// `.from` para registrar cada `upload`/`remove` real hecho por el código bajo prueba.
function spyOnBucket(supabase: ReturnType<typeof createSupabaseAuthFake>, bucket: string) {
  const uploadCalls: unknown[][] = []
  const removeCalls: unknown[][] = []
  const createSignedUrlCalls: unknown[][] = []
  const originalFrom = supabase.storage.from.bind(supabase.storage)

  vi.spyOn(supabase.storage, 'from').mockImplementation((requestedBucket: string) => {
    const original = originalFrom(requestedBucket)

    if (requestedBucket !== bucket) {
      return original
    }

    return {
      ...original,
      upload: (...args: unknown[]) => {
        uploadCalls.push(args)
        return (original.upload as (...a: unknown[]) => unknown)(...args)
      },
      remove: (...args: unknown[]) => {
        removeCalls.push(args)
        return (original.remove as (...a: unknown[]) => unknown)(...args)
      },
      createSignedUrl: (...args: unknown[]) => {
        createSignedUrlCalls.push(args)
        return (original.createSignedUrl as (...a: unknown[]) => unknown)(...args)
      },
    } as ReturnType<typeof originalFrom>
  })

  return { uploadCalls, removeCalls, createSignedUrlCalls }
}

const otherProfileId = 'profile-carlos'

function buildThreadRow(overrides: Record<string, unknown> = {}) {
  return {
    thread_id: 'thread-1',
    other_profile_id: otherProfileId,
    other_full_name: 'Carlos Ruiz',
    other_avatar_path: null,
    other_verification_status: 'unverified',
    last_message_body: 'Hola, ¿cómo va todo?',
    last_message_at: '2026-06-01T10:00:00.000Z',
    last_message_attachment_type: null,
    unread_count: 0,
    ...overrides,
  }
}

it('sends a message with only an image attachment (no text)', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'foto-sola@example.com',
    userMetadata: { full_name: 'Foto Sola', account_type: 'technician' },
  })
  const user = userEvent.setup()
  const sendMessageSpy = vi.fn((_args: Record<string, unknown> | undefined) => {
    void _args
    return { data: 'message-1' }
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_my_threads: { data: [buildThreadRow()] },
      get_thread_messages: { data: [] },
      mark_thread_read: { data: null },
      send_message: sendMessageSpy,
    },
  })
  const { uploadCalls } = spyOnBucket(supabase, 'message-media')
  const restoreCanvas = stubImageDownscale()

  try {
    await renderApp({ initialRoute: '/app/messages', supabase })

    await user.click(await screen.findByRole('button', { name: /Carlos Ruiz/ }))

    const input = document.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Attachment file input not found')
    }
    await user.upload(input, new File(['foto-bytes'], 'foto.jpg', { type: 'image/jpeg' }))
    await screen.findByRole('button', { name: /Quitar foto\.jpg/ })

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalled()
    })

    const rpcArgs = sendMessageSpy.mock.calls[0][0]!
    const attachments = rpcArgs.attachments as Array<{ path: string; type: string }>
    expect(rpcArgs.body_text).toBe('')
    expect(attachments).toHaveLength(1)
    expect(attachments[0].type).toBe('image')
    expect(attachments[0].path).toMatch(new RegExp(`^thread-1/${authState.user.id}/[0-9a-f-]{36}\\.webp$`))
    expect(uploadCalls.length).toBeGreaterThan(0)
  } finally {
    restoreCanvas()
  }
})

it('restores the message and attachment and cleans up storage when send_message fails', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'falla-envio@example.com',
    userMetadata: { full_name: 'Falla Envio', account_type: 'technician' },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_my_threads: { data: [buildThreadRow()] },
      get_thread_messages: { data: [] },
      mark_thread_read: { data: null },
      send_message: () => ({ error: { message: 'No tienes acceso a esta conversación.' } }),
    },
  })
  const { removeCalls } = spyOnBucket(supabase, 'message-media')
  const restoreCanvas = stubImageDownscale()

  try {
    await renderApp({ initialRoute: '/app/messages', supabase })

    await user.click(await screen.findByRole('button', { name: /Carlos Ruiz/ }))

    const input = document.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Attachment file input not found')
    }
    await user.upload(input, new File(['foto-bytes'], 'foto.jpg', { type: 'image/jpeg' }))
    await screen.findByRole('button', { name: /Quitar foto\.jpg/ })

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    await screen.findByText('No tienes acceso a esta conversación.')
    await waitFor(() => {
      expect(removeCalls.length).toBeGreaterThan(0)
    })
  } finally {
    restoreCanvas()
  }
})

it('renders an existing message attachment using a signed URL', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'ver-adjunto@example.com',
    userMetadata: { full_name: 'Ver Adjunto', account_type: 'technician' },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_my_threads: { data: [buildThreadRow()] },
      get_thread_messages: {
        data: [
          {
            id: 'msg-1',
            sender_id: otherProfileId,
            body: '',
            is_read: true,
            created_at: '2026-06-01T09:00:00.000Z',
            attachments: [
              {
                path: 'thread-1/profile-carlos/photo.webp',
                type: 'image',
                filename: null,
                size_bytes: null,
              },
            ],
          },
        ],
      },
      mark_thread_read: { data: null },
    },
  })
  const { createSignedUrlCalls } = spyOnBucket(supabase, 'message-media')

  const user = userEvent.setup()
  await renderApp({ initialRoute: '/app/messages', supabase })

  await user.click(await screen.findByRole('button', { name: /Carlos Ruiz/ }))

  const image = await screen.findByRole('img', { name: 'Adjunto' })
  expect(image).toHaveAttribute(
    'src',
    'https://signed.example/thread-1/profile-carlos/photo.webp?expiresIn=3600',
  )
  expect(createSignedUrlCalls.length).toBeGreaterThan(0)
})

it('surfaces the error instead of silently failing when ?to= cannot start a conversation', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'auto-mensaje@example.com',
    userMetadata: { full_name: 'Auto Mensaje', account_type: 'technician' },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_my_threads: { data: [] },
      start_or_get_thread: () => ({
        error: { message: 'No puedes enviarte mensajes a ti mismo.' },
      }),
    },
  })

  await renderApp({
    initialRoute: `/app/messages?to=${authState.user.id}`,
    supabase,
  })

  await screen.findByText('No puedes enviarte mensajes a ti mismo.')
})

it('opens the composer via ?to= even when the existing conversation was cleared and has no new messages', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'reabrir-chat@example.com',
    userMetadata: { full_name: 'Reabrir Chat', account_type: 'technician' },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      // list_my_threads oculta a propósito una conversación "borrada" (clear_thread)
      // sin mensajes nuevos, aunque start_or_get_thread siga devolviendo su id.
      list_my_threads: { data: [] },
      start_or_get_thread: () => ({ data: 'thread-cleared-1' }),
      get_thread_messages: { data: [] },
      mark_thread_read: { data: null },
      get_directory_profile_detail: {
        data: [
          {
            id: otherProfileId,
            full_name: 'Carlos Ruiz',
            role_title: 'Supervisor de calderas',
            organization_name: 'Ingenio San Miguel',
            country: 'El Salvador',
            short_bio: null,
            avatar_path: null,
            specialties: [],
            years_experience: null,
            experiences: [],
          },
        ],
      },
    },
  })

  await renderApp({
    initialRoute: `/app/messages?to=${otherProfileId}`,
    supabase,
  })

  await screen.findByLabelText('Escribe un mensaje')
  expect(screen.queryByText('Selecciona una conversación para comenzar.')).not.toBeInTheDocument()
})

it('shows a photo/video preview fallback in the thread list when the last message has no text', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'lista-preview@example.com',
    userMetadata: { full_name: 'Lista Preview', account_type: 'technician' },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_my_threads: {
        data: [
          buildThreadRow({
            last_message_body: '',
            last_message_attachment_type: 'image',
          }),
        ],
      },
    },
  })

  await renderApp({ initialRoute: '/app/messages', supabase })

  await screen.findByText('📷 Foto')
})
