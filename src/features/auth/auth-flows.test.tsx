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
  await user.type(screen.getByLabelText('Nombre completo'), 'Week 4 QA')
  await user.type(screen.getByLabelText('Email'), 'week4-qa@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Semana4Test123')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  await screen.findByRole('heading', { name: 'Completa tu perfil técnico' })

  expect(supabase.calls.signUp).toHaveLength(1)
  expect(supabase.calls.signUp[0]).toMatchObject({
    email: 'week4-qa@example.com',
    password: 'Semana4Test123',
    options: {
      data: {
        account_type: 'technician',
        full_name: 'Week 4 QA',
      },
    },
  })
  await screen.findByText(
    'Necesitamos unos datos más para preparar tu perfil técnico-profesional.',
  )
})

it('logs in and returns the user to onboarding when the profile is incomplete', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/login',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Iniciar sesión' })
  await user.type(screen.getByLabelText('Email'), 'week4-login@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Semana4Test123')
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))

  await screen.findByRole('heading', { name: 'Completa tu perfil técnico' })

  expect(supabase.calls.signInWithPassword).toHaveLength(1)
})

it('shows the signed-in user profile instead of the placeholder shell', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'week5-profile@example.com',
    userMetadata: {
      full_name: 'Week 5 Profile',
      account_type: 'technician',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
  })

  await renderApp({
    initialRoute: '/app/profile',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Week 5 Profile' })
  expect(screen.queryByText('Pantalla reservada para el perfil editable de la siguiente etapa.')).not.toBeInTheDocument()
})

it('keeps edited contact values while saving an experience entry', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'week5-edit@example.com',
    userMetadata: {
      full_name: 'Week 5 Edit',
      account_type: 'technician',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    data: {
      profiles: [
        {
          id: authState.user.id,
          account_type: 'technician',
          full_name: 'Week 5 Edit',
          country: 'El Salvador',
          role_title: 'Jefe de molinos',
          current_company_id: null,
          years_experience: 8,
          short_bio: 'Bio inicial',
          avatar_path: null,
          phone: null,
          whatsapp: null,
          linkedin_url: null,
          profile_status: 'complete',
          verification_status: 'unverified',
        },
      ],
      specialties: [{ id: 'molinos', name: 'Molinos', slug: 'molinos' }],
      profileSpecialties: [{ profile_id: authState.user.id, specialty_id: 'molinos' }],
    },
  })
  const user = userEvent.setup()

  await renderApp({
    initialRoute: '/app/profile/edit',
    supabase,
  })

  await screen.findByLabelText('LinkedIn')
  await user.type(
    screen.getByLabelText('LinkedIn'),
    'https://linkedin.com/in/week5-edit',
  )
  await user.type(screen.getByLabelText('Empresa'), 'Ingenio del Norte')
  await user.type(screen.getByLabelText('Cargo', { selector: '#experience-role' }), 'Supervisor')
  await user.type(screen.getByLabelText('Inicio'), '2020-01-01')
  await user.click(screen.getByRole('checkbox', { name: 'Experiencia actual' }))
  await user.click(screen.getByRole('button', { name: 'Agregar experiencia' }))

  await screen.findByText('Experiencia actualizada.')
  expect(screen.getByLabelText('LinkedIn')).toHaveValue(
    'https://linkedin.com/in/week5-edit',
  )
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

  await screen.findByRole('heading', { name: 'Zucarlink suma una capa comercial ligera para proveedores' })

  expect(supabase.calls.signOut).toHaveLength(1)
})
