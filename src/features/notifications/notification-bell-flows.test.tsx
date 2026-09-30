import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import { createAuthenticatedAuthState, createSupabaseAuthFake } from '../../test/fakes/supabase'

it('shows unread count, opens the feed, and marks an item read on click', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'tecnico@example.com',
    userMetadata: {
      full_name: 'Técnico Zucarlink',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()
  let markedRead: string | null = null

  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      count_my_unread_notifications: () => ({ data: 2 }),
      get_my_notifications: () => ({
        data: [
          {
            id: 'notif-1',
            type: 'forum_reply',
            actor_name: 'Ana Técnica',
            topic_title: 'Extracción en tándem',
            topic_slug: 'extraccion-en-tandem',
            read_at: null,
            created_at: new Date().toISOString(),
          },
        ],
      }),
      mark_notification_read: (args) => {
        markedRead = String(args?.p_notification_id)
        return { data: null }
      },
    },
  })

  await renderApp({
    initialRoute: '/app',
    supabase,
  })

  await screen.findByLabelText('Notificaciones, 2 sin leer')

  await user.click(screen.getByLabelText('Notificaciones, 2 sin leer'))
  await screen.findByText('Ana Técnica respondió a "Extracción en tándem"')

  await user.click(screen.getByRole('menuitem', { name: /Ana Técnica respondió/ }))

  expect(markedRead).toBe('notif-1')
  expect(screen.queryByRole('menu', { name: 'Notificaciones' })).not.toBeInTheDocument()
})

it('shows the empty state when there are no notifications', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'tecnico2@example.com',
    userMetadata: {
      full_name: 'Técnico Dos',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()

  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      count_my_unread_notifications: () => ({ data: 0 }),
      get_my_notifications: () => ({ data: [] }),
    },
  })

  await renderApp({
    initialRoute: '/app',
    supabase,
  })

  await user.click(await screen.findByLabelText('Notificaciones'))
  await screen.findByText('No tenés novedades. Las respuestas y mensajes van a aparecer acá.')
})
