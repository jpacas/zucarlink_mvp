import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../test/fakes/supabase'
import { renderApp } from '../test/render-app'

it('exposes a collapsible public menu for compact navigation', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/',
    supabase,
  })

  const menuButton = await screen.findByRole('button', { name: 'Abrir menú' })
  expect(menuButton).toHaveAttribute('aria-expanded', 'false')

  await user.click(menuButton)

  expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('navigation', { name: 'Principal' })).toHaveClass('main-nav--open')
})

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

  await screen.findByRole('heading', { name: 'Tu espacio en Zucarlink' })
  expect(screen.getByText(/Persisted User, mantén tu perfil al día/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Actualizar perfil' })).toHaveAttribute(
    'href',
    '/app/profile/edit',
  )
  expect(supabase.calls.getSession).toHaveLength(1)
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: 'Abriendo tu cuenta' })).not.toBeInTheDocument(),
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

it.each([
  ['/informacion', 'Información para seguirle el pulso al sector'],
  ['/informacion/noticias', 'Noticias del sector'],
  ['/informacion/blog', 'Artículos y análisis'],
  ['/informacion/eventos', 'Congresos y eventos'],
  ['/informacion/precios', 'Precios e indicadores'],
])('renders the public information route %s for anonymous users', async (route, heading) => {
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: route,
    supabase,
  })

  await screen.findByRole('heading', { name: heading })
})
