import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import { createAuthenticatedAuthState, createSupabaseAuthFake } from '../../test/fakes/supabase'

it('lets an admin search profiles, grant verification, and see it logged', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'admin@zucarlink.com',
    userMetadata: {
      full_name: 'Admin Zucarlink',
      account_type: 'technician',
    },
    appMetadata: {
      is_admin: true,
    },
  })
  const user = userEvent.setup()

  let verified = false

  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      admin_search_verifiable_profiles: () => ({
        data: [
          {
            id: 'profile-1',
            full_name: 'Ana Lucía Mejía',
            country: 'Guatemala',
            organization_name: 'Ingenio Santa Lucía',
            verification_status: verified ? 'verified' : 'unverified',
            updated_at: '2026-09-01T00:00:00.000Z',
          },
        ],
      }),
      admin_update_verification: (args) => {
        expect(args?.p_profile_id).toBe('profile-1')
        expect(args?.p_new_status).toBe('verified')
        verified = true
        return { data: null }
      },
      admin_list_verification_log: () => ({
        data: verified
          ? [
              {
                id: 'log-1',
                profile_id: 'profile-1',
                profile_full_name: 'Ana Lucía Mejía',
                admin_email: 'admin@zucarlink.com',
                previous_status: 'unverified',
                new_status: 'verified',
                created_at: '2026-09-30T00:00:00.000Z',
              },
            ]
          : [],
      }),
    },
  })

  await renderApp({
    initialRoute: '/app/admin/verificaciones',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Verificación de perfiles' })
  await screen.findByText('Ana Lucía Mejía')
  expect(screen.getByText('Sin cambios registrados todavía.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Otorgar verificación' }))

  await screen.findByText('Verificación otorgada a Ana Lucía Mejía.')
  expect(screen.getByRole('button', { name: 'Revocar' })).toBeInTheDocument()
  expect(screen.getByText(/Sin verificar → Verificado/)).toBeInTheDocument()
})

it('redirects a non-admin user away from /app/admin/verificaciones', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'tecnico@example.com',
    userMetadata: {
      full_name: 'Técnico Zucarlink',
      account_type: 'technician',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
  })

  await renderApp({
    initialRoute: '/app/admin/verificaciones',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Hola, Técnico' })
  expect(screen.queryByRole('heading', { name: 'Verificación de perfiles' })).not.toBeInTheDocument()
})
