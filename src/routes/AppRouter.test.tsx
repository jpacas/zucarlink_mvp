import { screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'

import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../test/fakes/supabase'
import { renderApp } from '../test/render-app'

it('redirects anonymous users from /app to /login', async () => {
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/app',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Iniciar sesión' })
  expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
})

it('keeps a preloaded session and renders /app directly after boot', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'persisted@example.com',
    userMetadata: {
      full_name: 'Persisted User',
      account_type: 'technician',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
  })

  await renderApp({
    initialRoute: '/app',
    supabase,
  })

  await screen.findByText('Usuario autenticado:')
  expect(screen.getByText('Persisted User')).toBeInTheDocument()
  expect(screen.getByText('/app')).toBeInTheDocument()
  expect(supabase.calls.getSession).toHaveLength(1)
  await waitFor(() =>
    expect(screen.queryByText('Verificando sesión...')).not.toBeInTheDocument(),
  )
})

it('redirects authenticated users away from /login to onboarding until their profile is complete', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'week5-redirect@example.com',
    userMetadata: {
      full_name: 'Redirect User',
      account_type: 'technician',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
  })

  await renderApp({
    initialRoute: '/login',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Completa tu perfil técnico' })
})
