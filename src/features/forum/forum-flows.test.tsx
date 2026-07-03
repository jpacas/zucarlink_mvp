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
    },
    replyCount: 3,
    likeCount: 12,
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

  const automationLinks = await screen.findAllByRole('link', { name: 'Automatización' })
  expect(automationLinks.length).toBeGreaterThan(0)
  expect(automationLinks[0]).toHaveAttribute('href', '/forum/category/automatizacion')
  expect(
    await screen.findByRole('link', {
      name:
        '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
    }),
  ).toBeInTheDocument()
  expect(await screen.findByTitle('3 respuestas')).toHaveTextContent('3')
  expect(screen.getByTitle('12 me gusta')).toHaveTextContent('12')
  expect(screen.getByRole('link', { name: 'Ana Mejía' })).toHaveAttribute(
    'href',
    '/directory/profile-ana',
  )
  expect(screen.getByText('A')).toBeInTheDocument()
})

it('filters the forum listing by keyword (accent-insensitive)', async () => {
  const user = userEvent.setup()
  const searchThreads = [
    {
      id: 'thread-vapor',
      slug: 'optimizacion-de-vapor',
      title: 'Optimización de vapor en calderas',
      excerpt: 'Ajustes de presión y purgas para estabilizar el vapor.',
      body: 'Ajustes de presión y purgas para estabilizar el vapor.',
      category: { slug: 'automatizacion', name: 'Automatización' },
      author: {
        id: 'profile-ana',
        fullName: 'Ana Mejía',
        roleTitle: 'Jefa de automatización',
        companyName: 'Ingenio El Carmen',
        avatarUrl: null,
      },
      replyCount: 2,
      likeCount: 4,
      createdAt: '2026-04-15T10:00:00.000Z',
      lastActivityAt: '2026-04-15T14:00:00.000Z',
    },
    {
      id: 'thread-molienda',
      slug: 'preparacion-de-cana',
      title: 'Preparación de caña en molienda',
      excerpt: 'Cuchillas y desfibradoras para mejorar la extracción.',
      body: 'Cuchillas y desfibradoras para mejorar la extracción.',
      category: { slug: 'molienda', name: 'Molienda' },
      author: {
        id: 'profile-carlos',
        fullName: 'Carlos Ruiz',
        roleTitle: 'Supervisor de molinos',
        companyName: 'Ingenio San Miguel',
        avatarUrl: null,
      },
      replyCount: 1,
      likeCount: 1,
      createdAt: '2026-04-14T10:00:00.000Z',
      lastActivityAt: '2026-04-14T12:00:00.000Z',
    },
  ]

  const supabase = createSupabaseAuthFake({
    rpc: {
      list_forum_categories: { data: forumCategories },
      list_forum_threads: { data: searchThreads },
    },
  })

  await renderApp({ initialRoute: '/forum', supabase })

  // Ambos hilos visibles al inicio.
  expect(
    await screen.findByRole('link', { name: 'Optimización de vapor en calderas' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Preparación de caña en molienda' }),
  ).toBeInTheDocument()

  const searchInput = screen.getByLabelText('Buscar por palabra clave')

  // Filtra por palabra clave: solo el hilo de molienda permanece.
  await user.type(searchInput, 'molienda')
  expect(
    screen.getByRole('link', { name: 'Preparación de caña en molienda' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('link', { name: 'Optimización de vapor en calderas' }),
  ).not.toBeInTheDocument()
  expect(screen.getByText('1 resultado para «molienda»')).toBeInTheDocument()

  // Búsqueda sin acentos encuentra el título acentuado.
  await user.clear(searchInput)
  await user.type(searchInput, 'optimizacion')
  expect(
    screen.getByRole('link', { name: 'Optimización de vapor en calderas' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('link', { name: 'Preparación de caña en molienda' }),
  ).not.toBeInTheDocument()

  // Sin coincidencias: estado vacío con opción de limpiar.
  await user.clear(searchInput)
  await user.type(searchInput, 'zzzznoexiste')
  expect(
    screen.getByRole('heading', { name: 'Sin resultados para «zzzznoexiste»' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
  expect(
    screen.getByRole('link', { name: 'Optimización de vapor en calderas' }),
  ).toBeInTheDocument()
})

it('keeps the public forum shareable when forum data cannot load', async () => {
  await renderApp({
    initialRoute: '/forum',
    supabase: null,
  })

  await screen.findByRole('heading', { name: 'Foro técnico' })
  expect(await screen.findByText('El foro público estará disponible pronto.')).toBeInTheDocument()
  expect(screen.queryByText(/Supabase/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/No fue posible cargar/i)).not.toBeInTheDocument()
})

it('shows the public thread detail and asks anonymous visitors to sign in before replying', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_forum_thread: {
        data: threadDetail,
      },
      get_forum_topic_like_state: {
        data: [{ like_count: 5, viewer_liked: false }],
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
    screen.getByRole('link', { name: 'Iniciar sesión' }),
  ).toHaveAttribute('href', '/login')
  expect(screen.queryByRole('button', { name: 'Publicar respuesta' })).not.toBeInTheDocument()
  // Visitantes anónimos ven el conteo de likes pero el control lleva a iniciar sesión.
  const anonLike = await screen.findByRole('link', { name: 'Inicia sesión para reaccionar' })
  expect(anonLike).toHaveAttribute('href', '/login')
  expect(anonLike).toHaveTextContent('5')
})

it('lets an authenticated member like and unlike the thread', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'liker@example.com',
    userMetadata: {
      full_name: 'Lectora Activa',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const toggleLike = vi
    .fn()
    .mockReturnValueOnce({ data: [{ like_count: 6, viewer_liked: true }] })
    .mockReturnValueOnce({ data: [{ like_count: 5, viewer_liked: false }] })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_forum_thread: {
        data: threadDetail,
      },
      get_forum_topic_like_state: {
        data: [{ like_count: 5, viewer_liked: false }],
      },
      toggle_forum_topic_like: toggleLike,
    },
  })

  await renderApp({
    initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
    supabase,
  })

  const likeButton = await screen.findByRole('button', { name: 'Me gusta' })
  expect(likeButton).toHaveTextContent('5')

  await user.click(likeButton)

  await waitFor(() => {
    expect(toggleLike).toHaveBeenCalledWith({
      thread_slug: 'automatizacion-mano-de-obra-barata',
    })
  })
  const likedButton = await screen.findByRole('button', { name: 'Quitar me gusta' })
  expect(likedButton).toHaveTextContent('6')

  await user.click(likedButton)
  expect(await screen.findByRole('button', { name: 'Me gusta' })).toHaveTextContent('5')
})

it('copies the thread link when sharing without native share support', async () => {
  const user = userEvent.setup()

  const writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_forum_thread: {
        data: threadDetail,
      },
      get_forum_topic_like_state: {
        data: [{ like_count: 0, viewer_liked: false }],
      },
    },
  })

  await renderApp({
    initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
    supabase,
  })

  await user.click(await screen.findByRole('button', { name: 'Compartir' }))
  await user.click(await screen.findByRole('menuitem', { name: 'Copiar enlace' }))

  await waitFor(() => {
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })
  expect(await screen.findByText('Enlace copiado')).toBeInTheDocument()
})

it('lets an authenticated member like a thread from the listing', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'lister@example.com',
    userMetadata: {
      full_name: 'Lectora Lista',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const toggleLike = vi.fn(() => ({ data: [{ like_count: 13, viewer_liked: true }] }))
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_forum_categories: { data: forumCategories },
      list_forum_threads: { data: forumThreads },
      toggle_forum_topic_like: toggleLike,
    },
  })

  await renderApp({ initialRoute: '/forum', supabase })

  const likeButton = await screen.findByRole('button', { name: 'Me gusta' })
  expect(likeButton).toHaveTextContent('12')

  await user.click(likeButton)

  await waitFor(() => {
    expect(toggleLike).toHaveBeenCalledWith({
      thread_slug: 'automatizacion-mano-de-obra-barata',
    })
  })
  expect(await screen.findByRole('button', { name: 'Quitar me gusta' })).toHaveTextContent('13')
})

it('lets an authenticated member reply to a thread directly from the listing', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'replier@example.com',
    userMetadata: {
      full_name: 'Respondón Directo',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const createReply = vi.fn(() => ({ data: [{ id: 'reply-new' }] }))
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_forum_categories: { data: forumCategories },
      list_forum_threads: { data: forumThreads },
      create_forum_reply: createReply,
    },
  })

  await renderApp({ initialRoute: '/forum', supabase })

  await user.click(await screen.findByRole('button', { name: 'Responder' }))
  await user.type(
    await screen.findByLabelText(/Responder a/),
    'Aporte rápido desde el listado.',
  )
  await user.click(screen.getByRole('button', { name: 'Publicar respuesta' }))

  await waitFor(() => {
    expect(createReply).toHaveBeenCalledWith({
      thread_slug: 'automatizacion-mano-de-obra-barata',
      body_text: 'Aporte rápido desde el listado.',
      parent_reply_id: undefined,
    })
  })
  expect(await screen.findByText('Respuesta publicada.')).toBeInTheDocument()
})

it('collapses replies to replies until expanded', async () => {
  const nestedDetail = {
    ...forumThreads[0],
    replies: [
      {
        id: 'reply-direct',
        body: 'Respuesta directa al tema del foro.',
        createdAt: '2026-04-15T14:00:00.000Z',
        parentReplyId: null,
        parentAuthorName: null,
        author: {
          id: 'profile-carlos',
          fullName: 'Carlos Ruiz',
          roleTitle: 'Supervisor de calderas',
          companyName: 'Ingenio San Miguel',
          avatarUrl: null,
        },
      },
      {
        id: 'reply-nested',
        body: 'Esta es una respuesta a la respuesta.',
        createdAt: '2026-04-15T15:00:00.000Z',
        parentReplyId: 'reply-direct',
        parentAuthorName: 'Carlos Ruiz',
        author: {
          id: 'profile-diana',
          fullName: 'Diana López',
          roleTitle: 'Ingeniera de procesos',
          companyName: 'Ingenio La Cabaña',
          avatarUrl: null,
        },
      },
    ],
  }
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_forum_thread: { data: nestedDetail },
      get_forum_topic_like_state: { data: [{ like_count: 0, viewer_liked: false }] },
    },
  })

  await renderApp({
    initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
    supabase,
  })

  expect(await screen.findByText('Respuesta directa al tema del foro.')).toBeInTheDocument()
  // La respuesta anidada permanece oculta hasta expandir.
  expect(screen.queryByText('Esta es una respuesta a la respuesta.')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Ver 1 respuesta' }))

  expect(await screen.findByText('Esta es una respuesta a la respuesta.')).toBeInTheDocument()
})

it('blocks members with an unconfirmed email from creating new threads', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'unconfirmed@example.com',
    emailConfirmed: false,
    userMetadata: {
      full_name: 'Correo Sin Confirmar',
      account_type: 'technician',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
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

  await screen.findByText('Confirma tu correo para abrir un tema nuevo.')
  expect(screen.getByRole('link', { name: 'Volver al foro' })).toHaveAttribute('href', '/forum')
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
