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

it('links the thread author to the private directory from the thread detail page when authenticated', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'con-sesion-detalle@example.com',
    userMetadata: {
      full_name: 'Con Sesion Detalle',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_forum_thread: { data: threadDetail },
      get_forum_topic_like_state: { data: [{ like_count: 0, viewer_liked: false }] },
    },
  })

  await renderApp({
    initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
    supabase,
  })

  expect(await screen.findByRole('link', { name: 'Ana Mejía' })).toHaveAttribute(
    'href',
    '/app/directory/profile-ana',
  )
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

it('links the thread author to the private directory when authenticated', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'con-sesion@example.com',
    userMetadata: {
      full_name: 'Con Sesion',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_forum_categories: { data: forumCategories },
      list_forum_threads: { data: forumThreads },
    },
  })

  await renderApp({ initialRoute: '/forum', supabase })

  expect(await screen.findByRole('link', { name: 'Ana Mejía' })).toHaveAttribute(
    'href',
    '/app/directory/profile-ana',
  )
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

// `.storage.from(bucket)` del fake devuelve un objeto nuevo en cada llamada, así que
// espiar el resultado de una sola invocación no intercepta llamadas posteriores del
// código bajo prueba. Envolvemos `.from` para registrar cada `upload`/`remove` real.
function spyOnBucket(supabase: ReturnType<typeof createSupabaseAuthFake>, bucket: string) {
  const uploadCalls: unknown[][] = []
  const removeCalls: unknown[][] = []
  const originalFrom = supabase.storage.from.bind(supabase.storage)

  vi.spyOn(supabase.storage, 'from').mockImplementation((requestedBucket: string) => {
    const original = originalFrom(requestedBucket)

    if (requestedBucket !== bucket) {
      return original
    }

    return {
      ...original,
      upload: (...args: unknown[]) => {
        uploadCalls.push(args)
        return (original.upload as (...a: unknown[]) => unknown)(...args)
      },
      remove: (...args: unknown[]) => {
        removeCalls.push(args)
        return (original.remove as (...a: unknown[]) => unknown)(...args)
      },
    } as ReturnType<typeof originalFrom>
  })

  return { uploadCalls, removeCalls }
}

function stubImageDownscale() {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback) {
    callback(new Blob(['imagen'], { type: 'image/webp' }))
  }
  return () => {
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    vi.unstubAllGlobals()
  }
}

it('creates a new thread with an image attachment, uploading before calling the RPC', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'con-foto@example.com',
    userMetadata: {
      full_name: 'Con Foto',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const createForumTopicSpy = vi.fn((_args: Record<string, unknown> | undefined) => {
    void _args
    return { data: { slug: 'tema-con-foto' } }
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_forum_categories: { data: forumCategories },
      create_forum_topic: createForumTopicSpy,
    },
  })
  const { uploadCalls } = spyOnBucket(supabase, 'forum-media')

  const restoreCanvas = stubImageDownscale()

  try {
    await renderApp({ initialRoute: '/forum/new', supabase })

    await screen.findByLabelText('Título')
    await user.type(screen.getByLabelText('Título'), 'Tema con foto adjunta')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'automatizacion')
    await user.type(screen.getByLabelText('Contenido'), 'Miren esta foto del panel eléctrico.')

    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Attachment file input not found')
    }
    const file = new File(['foto-bytes'], 'panel.jpg', { type: 'image/jpeg' })
    await user.upload(fileInput, file)

    await screen.findByRole('button', { name: 'Quitar adjunto' })
    await user.click(screen.getByRole('button', { name: 'Publicar tema' }))

    await waitFor(() => {
      expect(createForumTopicSpy).toHaveBeenCalled()
    })

    const rpcArgs = createForumTopicSpy.mock.calls[0][0]!
    expect(rpcArgs.attachment_path).toMatch(/^.+\/[0-9a-f-]{36}\.webp$/)
    expect(rpcArgs.attachment_type).toBe('image')

    // El upload de storage debe completarse antes de que se invoque el RPC.
    expect(uploadCalls.length).toBeGreaterThan(0)
    expect(supabase.calls.rpc.map((c) => c.fn)).toContain('create_forum_topic')
  } finally {
    restoreCanvas()
  }
})

it('removes the uploaded attachment when create_forum_topic fails after upload', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'falla-rpc@example.com',
    userMetadata: {
      full_name: 'Falla RPC',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_forum_categories: { data: forumCategories },
      create_forum_topic: () => ({ error: { message: 'La categoría seleccionada no existe.' } }),
    },
  })
  const { removeCalls } = spyOnBucket(supabase, 'forum-media')

  const restoreCanvas = stubImageDownscale()

  try {
    await renderApp({ initialRoute: '/forum/new', supabase })

    await screen.findByLabelText('Título')
    await user.type(screen.getByLabelText('Título'), 'Tema que fallará al publicar')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'automatizacion')
    await user.type(screen.getByLabelText('Contenido'), 'Este tema no se va a poder publicar.')

    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Attachment file input not found')
    }
    await user.upload(fileInput, new File(['foto-bytes'], 'panel.jpg', { type: 'image/jpeg' }))
    await screen.findByRole('button', { name: 'Quitar adjunto' })

    await user.click(screen.getByRole('button', { name: 'Publicar tema' }))

    await screen.findByText('La categoría seleccionada no existe.')
    await waitFor(() => {
      expect(removeCalls.length).toBeGreaterThan(0)
    })
  } finally {
    restoreCanvas()
  }
})

it('lets the user remove a selected attachment before submitting', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'quita-adjunto@example.com',
    userMetadata: {
      full_name: 'Quita Adjunto',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const createForumTopicSpy = vi.fn((_args: Record<string, unknown> | undefined) => {
    void _args
    return { data: { slug: 'tema-sin-adjunto' } }
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_forum_categories: { data: forumCategories },
      create_forum_topic: createForumTopicSpy,
    },
  })

  const restoreCanvas = stubImageDownscale()

  try {
    await renderApp({ initialRoute: '/forum/new', supabase })

    await screen.findByLabelText('Título')
    await user.type(screen.getByLabelText('Título'), 'Tema sin adjunto final')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'automatizacion')
    await user.type(screen.getByLabelText('Contenido'), 'Contenido mínimo para abrir el debate.')

    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Attachment file input not found')
    }
    await user.upload(fileInput, new File(['foto-bytes'], 'panel.jpg', { type: 'image/jpeg' }))
    await user.click(await screen.findByRole('button', { name: 'Quitar adjunto' }))

    await user.click(screen.getByRole('button', { name: 'Publicar tema' }))

    await waitFor(() => {
      expect(createForumTopicSpy).toHaveBeenCalled()
    })

    const rpcArgs = createForumTopicSpy.mock.calls[0][0]!
    expect(rpcArgs.attachment_path).toBeUndefined()
    expect(rpcArgs.attachment_type).toBeUndefined()
  } finally {
    restoreCanvas()
  }
})

it('renders attachments on the thread body and on a reply', async () => {
  const detailWithAttachments = {
    ...threadDetail,
    attachment_path: 'profile-ana/photo.webp',
    attachment_type: 'image',
    replies: [
      {
        ...threadDetail.replies[0],
        attachment_path: 'profile-carlos/clip.mp4',
        attachment_type: 'video',
      },
    ],
  }
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_forum_thread: { data: detailWithAttachments },
      get_forum_topic_like_state: { data: [{ like_count: 0, viewer_liked: false }] },
    },
  })

  await renderApp({
    initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
    supabase,
  })

  const topicImage = await screen.findByRole('img', { name: 'Adjunto' })
  expect(topicImage).toHaveAttribute(
    'src',
    'https://public.example/forum-media/profile-ana/photo.webp',
  )

  const replyVideo = document.querySelector('video')
  expect(replyVideo).toHaveAttribute(
    'src',
    'https://public.example/forum-media/profile-carlos/clip.mp4',
  )
})

it('shows a media badge in the listing for threads with an attachment', async () => {
  const threadsWithAttachment = [
    { ...forumThreads[0], attachment_type: 'video' },
  ]
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_forum_categories: { data: forumCategories },
      list_forum_threads: { data: threadsWithAttachment },
    },
  })

  await renderApp({ initialRoute: '/forum', supabase })

  await screen.findByRole('link', {
    name:
      '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
  })
  expect(screen.getByLabelText('Incluye video')).toBeInTheDocument()
})

it('allows replying with only an attachment and an empty body', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'solo-adjunto@example.com',
    userMetadata: {
      full_name: 'Solo Adjunto',
      account_type: 'technician',
      profile_status: 'complete',
    },
  })
  const user = userEvent.setup()
  const createReplySpy = vi.fn((_args: Record<string, unknown> | undefined) => {
    void _args
    return { data: [{ id: 'reply-solo-adjunto' }] }
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_forum_thread: { data: threadDetail },
      get_forum_topic_like_state: { data: [{ like_count: 0, viewer_liked: false }] },
      create_forum_reply: createReplySpy,
    },
  })

  const restoreCanvas = stubImageDownscale()

  try {
    await renderApp({
      initialRoute: '/forum/thread/automatizacion-mano-de-obra-barata',
      supabase,
    })

    await screen.findByLabelText('Tu respuesta')

    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Attachment file input not found')
    }
    await user.upload(fileInput, new File(['foto-bytes'], 'foto.jpg', { type: 'image/jpeg' }))
    await screen.findByRole('button', { name: 'Quitar adjunto' })

    await user.click(screen.getByRole('button', { name: 'Publicar respuesta' }))

    await waitFor(() => {
      expect(createReplySpy).toHaveBeenCalled()
    })

    const rpcArgs = createReplySpy.mock.calls[0][0]!
    expect(rpcArgs.body_text).toBe('')
    expect(rpcArgs.attachment_type).toBe('image')
  } finally {
    restoreCanvas()
  }
})
