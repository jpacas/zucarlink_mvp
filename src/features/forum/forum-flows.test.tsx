import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

const forumCategories = [
  {
    id: 'category-automatizacion',
    slug: 'automatizacion',
    name: 'Automatización',
    description: 'Control, PLC e instrumentación aplicada a ingenios.',
  },
  {
    id: 'category-molienda',
    slug: 'molienda',
    name: 'Molienda',
    description: 'Ajustes, preparación de caña y extracción.',
  },
]

const forumThreads = [
  {
    id: 'thread-automatizacion',
    slug: 'automatizacion-mano-de-obra-barata',
    title:
      '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
    excerpt:
      'Quiero comparar retorno real entre automatizaciones pequeñas y rediseños mayores en fábrica.',
    body:
      'Quiero comparar retorno real entre automatizaciones pequeñas y rediseños mayores en fábrica.',
    category: {
      slug: 'automatizacion',
      name: 'Automatización',
    },
    author: {
      id: 'profile-ana',
      fullName: 'Ana Mejía',
      roleTitle: 'Jefa de automatización',
      companyName: 'Ingenio El Carmen',
      avatarUrl: null,
      verificationStatus: 'verified',
    },
    replyCount: 3,
    createdAt: '2026-04-15T10:00:00.000Z',
    lastActivityAt: '2026-04-15T14:00:00.000Z',
  },
]

const threadDetail = {
  ...forumThreads[0],
  replies: [
    {
      id: 'reply-1',
      body: 'Empezamos por instrumentación crítica y pagó solo en una zafra.',
      createdAt: '2026-04-15T14:00:00.000Z',
      parentReplyId: null,
      parentAuthorName: null,
      author: {
        id: 'profile-carlos',
        fullName: 'Carlos Ruiz',
        roleTitle: 'Supervisor de calderas',
        companyName: 'Ingenio San Miguel',
        avatarUrl: null,
        verificationStatus: 'unverified',
      },
    },
  ],
}

it('renders the public forum listing with categories and thread metadata', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_forum_categories: {
        data: forumCategories,
      },
      list_forum_threads: {
        data: forumThreads,
      },
    },
  })

  await renderApp({
    initialRoute: '/forum',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Foro técnico' })
  expect(screen.getAllByRole('link', { name: /Automatización/i }).length).toBeGreaterThan(0)
  expect(
    screen.getByRole('link', {
      name:
        '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
    }),
  ).toBeInTheDocument()
  expect(screen.getByText('3 respuestas')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ana Mejía' })).toHaveAttribute(
    'href',
    '/directory/profile-ana',
  )
  expect(screen.getByText('A')).toBeInTheDocument()
})

it('shows the public thread detail and asks anonymous visitors to sign in before replying', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_forum_thread: {
        data: threadDetail,
      },
    },
  })

  await renderApp({
    initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
    supabase,
  })

  await screen.findByRole('heading', {
    name:
      '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
  })
  expect(screen.getByText('Empezamos por instrumentación crítica y pagó solo en una zafra.')).toBeInTheDocument()
  expect(screen.getByText('Inicia sesión para comentar')).toBeInTheDocument()
  expect(screen.getByText('C')).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Ingresar para responder' }),
  ).toHaveAttribute('href', '/login')
  expect(screen.queryByRole('button', { name: 'Publicar respuesta' })).not.toBeInTheDocument()
})

it('blocks incomplete profiles from creating new threads', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'incomplete@example.com',
    userMetadata: {
      full_name: 'Perfil Incompleto',
      account_type: 'technician',
      profile_status: 'incomplete',
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
          full_name: 'Perfil Incompleto',
          country: 'El Salvador',
          role_title: '',
          current_company_id: null,
          years_experience: null,
          short_bio: '',
          avatar_path: null,
          phone: null,
          whatsapp: null,
          linkedin_url: null,
          profile_status: 'incomplete',
          verification_status: 'unverified',
        },
      ],
    },
    rpc: {
      list_forum_categories: {
        data: forumCategories,
      },
    },
  })

  await renderApp({
    initialRoute: '/forum/new',
    supabase,
  })

  await screen.findByText('Completa tu perfil para abrir un tema nuevo.')
  expect(screen.getByRole('link', { name: 'Completar perfil' })).toHaveAttribute(
    'href',
    '/onboarding',
  )
  expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
})

it('allows complete profiles to create a new thread', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'complete@example.com',
    userMetadata: {
      full_name: 'Perfil Completo',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const createForumTopic = vi.fn(() => ({
    data: {
      slug: 'nuevo-hilo-desde-tests',
    },
  }))
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    data: {
      profiles: [
        {
          id: authState.user.id,
          account_type: 'technician',
          full_name: 'Perfil Completo',
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
      list_forum_categories: {
        data: forumCategories,
      },
      create_forum_topic: createForumTopic,
    },
  })
  const profileSnapshot = await supabase
    .from('profiles')
    .select('id, profile_status')
    .eq('id', authState.user.id)
    .maybeSingle()

  expect(profileSnapshot.data).toEqual({
    id: authState.user.id,
    profile_status: 'complete',
  })

  await renderApp({
    initialRoute: '/forum/new',
    supabase,
  })

  await screen.findByLabelText('Título')
  await user.type(screen.getByLabelText('Título'), 'Nuevo hilo desde tests')
  await user.selectOptions(screen.getByLabelText('Categoría'), 'automatizacion')
  await user.type(screen.getByLabelText('Contenido'), 'Contenido mínimo para abrir el debate.')
  await user.click(screen.getByRole('button', { name: 'Publicar tema' }))

  await waitFor(() => {
    expect(createForumTopic).toHaveBeenCalledWith({
      body_text: 'Contenido mínimo para abrir el debate.',
      category_slug: 'automatizacion',
      title_text: 'Nuevo hilo desde tests',
    })
  })
})

it('renders a public profile with forum activity from the author link', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_public_member_profile: {
        data: {
          id: 'profile-ana',
          full_name: 'Ana Mejía',
          avatar_path: null,
          role_title: 'Jefa de automatización',
          organization_name: 'Ingenio El Carmen',
          country: 'El Salvador',
          short_bio: 'Automatización aplicada a molienda y vapor.',
          verification_status: 'verified',
        },
      },
      get_profile_forum_activity: {
        data: {
          thread_count: 4,
          reply_count: 9,
          top_categories: ['Automatización', 'Energía'],
          recent_contributions: [
            {
              id: 'contribution-1',
              type: 'thread',
              title:
                '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
              slug: 'automatizacion-mano-de-obra-barata',
              created_at: '2026-04-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/directory/profile-ana',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Ana Mejía' })
  expect(screen.getByText('4 temas')).toBeInTheDocument()
  expect(screen.getByText('9 respuestas')).toBeInTheDocument()
  expect(screen.getByText('Automatización')).toBeInTheDocument()
  expect(screen.queryByText(/Email:/)).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', {
      name:
        '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
    }),
  ).toHaveAttribute('href', '/forum/thread/automatizacion-mano-de-obra-barata')
})
