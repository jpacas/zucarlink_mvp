import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

it('registers with account type and full name, then enters /app when a session is returned', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/register',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Crear cuenta' })
  await user.click(screen.getByRole('radio', { name: 'Proveedor' }))
  await user.type(screen.getByLabelText('Nombre completo'), 'Week 4 QA')
  await user.type(screen.getByLabelText('Email'), 'week4-qa@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Semana4Test123')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  await screen.findByRole('heading', { name: 'Panel privado' })

  expect(supabase.calls.signUp).toHaveLength(1)
  expect(supabase.calls.signUp[0]).toMatchObject({
    email: 'week4-qa@example.com',
    password: 'Semana4Test123',
    options: {
      data: {
        account_type: 'provider',
        full_name: 'Week 4 QA',
      },
    },
  })
  expect(screen.getByText('Week 4 QA')).toBeInTheDocument()
  expect(screen.getByText('provider')).toBeInTheDocument()
})

it('logs in and returns the user to the originally requested private route', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/app/profile',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Iniciar sesión' })
  await user.type(screen.getByLabelText('Email'), 'week4-login@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Semana4Test123')
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))

  await screen.findByRole('heading', { name: 'Perfil' })

  expect(supabase.calls.signInWithPassword).toHaveLength(1)
  expect(screen.getByText('/app/profile')).toBeInTheDocument()
})

it('logs out from the private layout and returns home', async () => {
  const user = userEvent.setup()
  const authState = createAuthenticatedAuthState({
    email: 'week4-logout@example.com',
    userMetadata: {
      full_name: 'Logout User',
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

  await screen.findByRole('heading', { name: 'Panel privado' })
  await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

  await screen.findByRole('heading', { name: 'Skeletons funcionales y navegación base del MVP' })

  expect(supabase.calls.signOut).toHaveLength(1)
})
