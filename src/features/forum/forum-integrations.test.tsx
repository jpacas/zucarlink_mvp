import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

it('shows a forum preview on the public home page', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_forum_threads: {
        data: [
          {
            id: 'thread-1',
            slug: 'automatizacion-mano-de-obra-barata',
            title:
              '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
            excerpt: 'Debate inicial de automatización.',
            body: 'Debate inicial de automatización.',
            category: {
              slug: 'automatizacion',
              name: 'Automatización',
            },
            author: {
              id: 'profile-ana',
              full_name: 'Ana Mejía',
              role_title: 'Jefa de automatización',
              organization_name: 'Ingenio El Carmen',
              avatar_path: null,
              verification_status: 'verified',
            },
            reply_count: 3,
            created_at: '2026-04-15T10:00:00.000Z',
            last_activity_at: '2026-04-15T14:00:00.000Z',
          },
        ],
      },
    },
  })

  await renderApp({
    initialRoute: '/',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Conversaciones técnicas activas' })
  expect(
    await screen.findByRole('link', {
      name:
        '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
    }),
  ).toHaveAttribute('href', '/forum/thread/automatizacion-mano-de-obra-barata')
  expect(screen.getAllByRole('link', { name: 'Ver foro' })[0]).toHaveAttribute('href', '/forum')
})

it('shows forum activity inside the authenticated profile page', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'profile@example.com',
    userMetadata: {
      full_name: 'Perfil Activo',
      account_type: 'technician',
      profile_status: 'complete',
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
          full_name: 'Perfil Activo',
          country: 'El Salvador',
          role_title: 'Jefe de fábrica',
          current_company_id: null,
          years_experience: 10,
          short_bio: 'Perfil listo para participar.',
          avatar_path: null,
          phone: null,
          whatsapp: null,
          linkedin_url: null,
          profile_status: 'complete',
          verification_status: 'verified',
        },
      ],
    },
    rpc: {
      get_profile_forum_activity: {
        data: {
          thread_count: 2,
          reply_count: 7,
          top_categories: ['Automatización', 'Energía'],
          recent_contributions: [
            {
              id: 'contribution-1',
              type: 'thread',
              title: 'Balance de vapor en días de alta humedad',
              slug: 'balance-de-vapor-humedad',
              created_at: '2026-04-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/app/profile',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Actividad en foro' })
  expect(screen.getByText('2 temas')).toBeInTheDocument()
  expect(screen.getByText('7 respuestas')).toBeInTheDocument()
  expect(screen.getByText('Automatización')).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Balance de vapor en días de alta humedad' }),
  ).toHaveAttribute('href', '/forum/thread/balance-de-vapor-humedad')
})
