import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

it('shows notification preferences defaulting to enabled when no row exists yet', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'prefs-default@example.com',
    userMetadata: { full_name: 'Prefs Default', account_type: 'technician' },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
  })

  await renderApp({ initialRoute: '/app/settings', supabase })

  await screen.findByRole('heading', { name: 'Notificaciones' })
  expect(
    await screen.findByRole('checkbox', { name: 'Recordatorio de mensajes sin leer (a las 24 horas)' }),
  ).toBeChecked()
  expect(
    screen.getByRole('checkbox', { name: 'Pausar todos los correos de notificación' }),
  ).not.toBeChecked()
})

it('persists a toggle change from the settings page', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'prefs-toggle@example.com',
    userMetadata: { full_name: 'Prefs Toggle', account_type: 'technician' },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
  })
  const user = userEvent.setup()

  await renderApp({ initialRoute: '/app/settings', supabase })

  const checkbox = await screen.findByRole('checkbox', {
    name: 'Respuestas a temas que abriste en el foro',
  })
  expect(checkbox).toBeChecked()

  await user.click(checkbox)

  expect(checkbox).not.toBeChecked()
  const row = supabase
    .from('notification_preferences')
    .select('email_forum_reply')
    .eq('user_id', authState.user.id)
  const { data } = await row.maybeSingle()
  expect(data).toMatchObject({ email_forum_reply: false })
})

it('lets an anonymous visitor manage preferences from a valid unsubscribe token', async () => {
  const prefsRow = {
    email_unread_reminder: true,
    email_forum_reply: true,
    email_liked_topic_reply: true,
    email_inactivity_digest: true,
    unsubscribed_all: false,
  }
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_email_prefs_by_token: (args) =>
        args?.p_token === 'good-token' ? { data: [{ ...prefsRow }] } : { data: [] },
      update_email_prefs_by_token: (args) => {
        if (args?.p_token !== 'good-token') return { data: false }
        Object.assign(prefsRow, args?.p_prefs as Record<string, boolean>)
        return { data: true }
      },
    },
  })
  const user = userEvent.setup()

  await renderApp({ initialRoute: '/preferencias-email?token=good-token', supabase })

  await screen.findByRole('heading', { name: 'Preferencias de correo' })
  const pauseAll = await screen.findByRole('checkbox', {
    name: 'Darme de baja de todos los correos de notificación',
  })
  expect(pauseAll).not.toBeChecked()

  await user.click(pauseAll)

  expect(pauseAll).toBeChecked()
  expect(prefsRow.unsubscribed_all).toBe(true)
})

it('shows an error for an invalid or missing unsubscribe token', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_email_prefs_by_token: () => ({ data: [] }),
    },
  })

  await renderApp({ initialRoute: '/preferencias-email?token=bad-token', supabase })

  await screen.findByText('El enlace no es válido o ya expiró.')

  await renderApp({ initialRoute: '/preferencias-email', supabase })

  await screen.findByText('El enlace no es válido.')
})
