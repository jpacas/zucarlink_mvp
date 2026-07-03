import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

const providerCategories = [
  { id: 'cat-automation', slug: 'automatizacion', name: 'Automatización' },
  { id: 'cat-lab', slug: 'laboratorio', name: 'Laboratorio' },
]

const providerCards = [
  {
    id: 'provider-automation',
    slug: 'tecno-control',
    company_name: 'Tecno Control',
    logo_url: 'https://cdn.example.com/tecno-control.png',
    short_description: 'Automatización industrial para ingenios.',
    countries: ['Guatemala', 'El Salvador'],
    category: providerCategories[0],
  },
  {
    id: 'provider-lab',
    slug: 'lab-cana',
    company_name: 'Lab Caña',
    logo_url: 'https://cdn.example.com/lab-cana.png',
    short_description: 'Servicios de laboratorio y control de calidad.',
    countries: ['México'],
    category: providerCategories[1],
  },
]

it('renders the public providers landing and supports the legacy /providers redirect', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_provider_categories: { data: providerCategories },
      search_providers: { data: providerCards },
    },
  })

  await renderApp({
    initialRoute: '/providers',
    supabase,
  })

  await screen.findByRole('heading', {
    name: 'Proveedores con presencia útil dentro del sector azucarero',
  })
  expect(screen.getByRole('link', { name: 'Ver directorio de proveedores' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Solicitar activación comercial' })).toBeInTheDocument()
  expect(screen.queryByText(/semana 9/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/demo visibles/i)).not.toBeInTheDocument()
})

it('renders the providers directory, filters by category and opens the provider detail', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_provider_categories: { data: providerCategories },
      search_providers: (args) => {
        const searchText = String(args?.search_text ?? '').trim().toLowerCase()
        const categorySlug = String(args?.category_slug ?? '').trim().toLowerCase()
        const country = String(args?.country_filter ?? '').trim().toLowerCase()

        const filtered = providerCards.filter((provider) => {
          const matchesSearch =
            !searchText ||
            [provider.company_name, provider.short_description]
              .join(' ')
              .toLowerCase()
              .includes(searchText)
          const matchesCategory =
            !categorySlug || provider.category.slug.toLowerCase() === categorySlug
          const matchesCountry =
            !country ||
            provider.countries.some((item) => item.toLowerCase() === country)

          return matchesSearch && matchesCategory && matchesCountry
        })

        return { data: filtered }
      },
      get_provider_by_slug: (args) => {
        if (args?.provider_slug !== 'tecno-control') {
          return {
            data: null,
            error: { message: 'Proveedor no encontrado.' },
          }
        }

        return {
          data: {
            id: 'provider-automation',
            slug: 'tecno-control',
            company_name: 'Tecno Control',
            logo_url: 'https://cdn.example.com/tecno-control.png',
            short_description: 'Automatización industrial para ingenios.',
            long_description:
              'Integramos PLC, sensórica y soporte remoto para operación continua.',
            countries: ['Guatemala', 'El Salvador'],
            products_services: ['PLC', 'SCADA', 'Instrumentación'],
            website: 'https://tecnocontrol.example.com',
            contact_email: 'contacto@tecnocontrol.example.com',
            status: 'active',
            category: providerCategories[0],
          },
        }
      },
    },
  })

  await renderApp({
    initialRoute: '/proveedores/directorio',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Directorio de proveedores' })
  await screen.findByRole('option', { name: 'Automatización' })
  await user.selectOptions(screen.getByLabelText('Categoría'), 'automatizacion')
  await user.selectOptions(screen.getByLabelText('País'), 'El Salvador')

  const results = screen.getByTestId('providers-results')
  expect(within(results).getByText('Tecno Control')).toBeInTheDocument()
  expect(within(results).queryByText('Lab Caña')).not.toBeInTheDocument()
  expect(within(results).getByRole('img', { name: 'Logo de Tecno Control' })).toHaveAttribute(
    'src',
    'https://cdn.example.com/tecno-control.png',
  )

  await user.click(within(results).getByRole('link', { name: 'Ver perfil de Tecno Control' }))

  await screen.findByText('Descripción')
  expect(
    await screen.findByText(/Integramos PLC, sensórica y soporte remoto para operación continua\./i),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Contactar proveedor' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Logo de Tecno Control' })).toHaveAttribute(
    'src',
    'https://cdn.example.com/tecno-control.png',
  )
})

it('keeps the providers directory shareable when provider data cannot load', async () => {
  await renderApp({
    initialRoute: '/proveedores/directorio',
    supabase: null,
  })

  await screen.findByRole('heading', { name: 'Directorio de proveedores' })
  expect(
    await screen.findByText('El directorio de proveedores estará disponible pronto.'),
  ).toBeInTheDocument()
  expect(screen.queryByText(/Supabase/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/No fue posible cargar/i)).not.toBeInTheDocument()
})

it('routes a provider registration into the provider onboarding flow', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/register',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Crear cuenta' })
  await user.click(screen.getByLabelText('Proveedor'))
  await user.type(screen.getByLabelText('Nombre completo'), 'Proveedor Demo')
  await user.type(screen.getByLabelText('Email'), 'proveedor@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'ProveedorDemo123')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  await screen.findByRole('heading', { name: 'Activa tu perfil comercial' })
})

it('submits a provider lead from the public detail when the user is authenticated', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'compras@example.com',
    userMetadata: {
      full_name: 'Compras Ingenio',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_provider_by_slug: {
        data: {
          id: 'provider-automation',
          slug: 'tecno-control',
          company_name: 'Tecno Control',
          logo_url: null,
          short_description: 'Automatización industrial para ingenios.',
          long_description: 'Automatización, instrumentación y soporte remoto.',
          countries: ['Guatemala', 'El Salvador'],
          products_services: ['PLC', 'SCADA'],
          website: null,
          contact_email: 'contacto@tecnocontrol.example.com',
          status: 'active',
          category: providerCategories[0],
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/proveedores/tecno-control',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Tecno Control' })
  await user.click(screen.getByRole('button', { name: 'Contactar proveedor' }))

  await user.type(screen.getByLabelText('Nombre'), 'Compras Ingenio Central')
  await user.type(screen.getByLabelText('Email'), 'compras@ingenio.com')
  await user.type(screen.getByLabelText('Empresa'), 'Ingenio Central')
  await user.type(screen.getByLabelText('Mensaje'), 'Queremos una propuesta para automatización.')
  await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

  await screen.findByText('Tu solicitud fue enviada al proveedor.')
  expect(supabase.calls.rpc).toContainEqual({
    fn: 'create_provider_lead',
    args: {
      provider_id: 'provider-automation',
      name_text: 'Compras Ingenio Central',
      email_text: 'compras@ingenio.com',
      company_text: 'Ingenio Central',
      message_text: 'Queremos una propuesta para automatización.',
    },
  })
})

it('lets an anonymous visitor submit a provider lead without logging in', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_provider_by_slug: {
        data: {
          id: 'provider-automation',
          slug: 'tecno-control',
          company_name: 'Tecno Control',
          logo_url: null,
          short_description: 'Automatización industrial para ingenios.',
          long_description: 'Automatización, instrumentación y soporte remoto.',
          countries: ['Guatemala', 'El Salvador'],
          products_services: ['PLC', 'SCADA'],
          website: null,
          contact_email: 'contacto@tecnocontrol.example.com',
          status: 'active',
          category: providerCategories[0],
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/proveedores/tecno-control',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Tecno Control' })
  // The contact action is a button (not a login redirect) even when logged out
  await user.click(screen.getByRole('button', { name: 'Contactar proveedor' }))

  await user.type(screen.getByLabelText('Nombre'), 'Visitante Anónimo')
  await user.type(screen.getByLabelText('Email'), 'visitante@ingenio.com')
  await user.type(screen.getByLabelText('Mensaje'), 'Quiero información sin crear cuenta.')
  await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

  await screen.findByText('Tu solicitud fue enviada al proveedor.')
  expect(supabase.calls.rpc).toContainEqual({
    fn: 'create_provider_lead',
    args: {
      provider_id: 'provider-automation',
      name_text: 'Visitante Anónimo',
      email_text: 'visitante@ingenio.com',
      company_text: undefined,
      message_text: 'Quiero información sin crear cuenta.',
    },
  })
})

it('renders provider lead validation errors with error styling', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'validation@example.com',
    userMetadata: {
      full_name: 'Validation User',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_provider_by_slug: {
        data: {
          id: 'provider-automation',
          slug: 'tecno-control',
          company_name: 'Tecno Control',
          logo_url: null,
          short_description: 'Automatización industrial para ingenios.',
          long_description: 'Automatización, instrumentación y soporte remoto.',
          countries: ['Guatemala', 'El Salvador'],
          products_services: ['PLC', 'SCADA'],
          website: null,
          contact_email: 'contacto@tecnocontrol.example.com',
          status: 'active',
          category: providerCategories[0],
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/proveedores/tecno-control',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Tecno Control' })
  await user.click(screen.getByRole('button', { name: 'Contactar proveedor' }))
  fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form')!)

  const feedback = await screen.findByText('Completa nombre, email y mensaje.')
  expect(feedback).toHaveClass('error-text')
})

it('blocks obvious spam in the lead form before hitting the backend', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'compras@example.com',
    userMetadata: {
      full_name: 'Compras Ingenio',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_provider_by_slug: {
        data: {
          id: 'provider-automation',
          slug: 'tecno-control',
          company_name: 'Tecno Control',
          logo_url: 'https://cdn.example.com/tecno-control.png',
          short_description: 'Automatización industrial para ingenios.',
          long_description: 'Automatización, instrumentación y soporte remoto.',
          countries: ['Guatemala', 'El Salvador'],
          products_services: ['PLC', 'SCADA'],
          website: null,
          contact_email: 'contacto@tecnocontrol.example.com',
          status: 'active',
          category: providerCategories[0],
        },
      },
    },
  })

  const view = await renderApp({
    initialRoute: '/proveedores/tecno-control',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Tecno Control' })
  await user.click(screen.getByRole('button', { name: 'Contactar proveedor' }))

  await user.type(screen.getByLabelText('Nombre'), 'Compras Ingenio Central')
  await user.type(screen.getByLabelText('Email'), 'compras@ingenio.com')
  await user.type(screen.getByLabelText('Mensaje'), 'Mensaje que parece automatizado.')

  const honeypot = view.container.querySelector('input[name="company_website"]')
  if (!(honeypot instanceof HTMLInputElement)) {
    throw new Error('Spam honeypot field not found')
  }
  fireEvent.change(honeypot, { target: { value: 'https://spam.example.com' } })

  await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

  await screen.findByText('No fue posible validar tu solicitud.')
  expect(supabase.calls.rpc).not.toContainEqual(
    expect.objectContaining({
      fn: 'create_provider_lead',
    }),
  )
})

it('lets a provider review and update the status of their leads', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'ventas@proveedor.com',
    userMetadata: {
      full_name: 'Ventas Proveedor',
      account_type: 'provider',
    },
  })
  const leads = [
    {
      id: 'lead-1',
      provider_id: 'provider-1',
      name: 'Ingenio Central',
      email: 'compras@ingenio.com',
      company: 'Ingenio Central',
      message: 'Queremos una cotización de automatización.',
      status: 'new',
      created_at: '2026-06-20T10:00:00.000Z',
    },
  ]
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_provider_leads: () => ({ data: leads }),
      update_provider_lead_status: (args) => {
        const lead = leads.find((entry) => entry.id === args?.lead_id)
        if (lead && typeof args?.next_status === 'string') {
          lead.status = args.next_status
        }
        return { data: null }
      },
    },
  })

  await renderApp({
    initialRoute: '/app/provider/leads',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Solicitudes de contacto' })
  await screen.findByText('Ingenio Central')
  expect(screen.getByText('1 nuevas')).toBeInTheDocument()

  await user.selectOptions(
    screen.getByLabelText('Estado de la solicitud de Ingenio Central'),
    'contacted',
  )

  expect(supabase.calls.rpc).toContainEqual({
    fn: 'update_provider_lead_status',
    args: {
      lead_id: 'lead-1',
      next_status: 'contacted',
    },
  })
})

it('lets a provider upload a company logo from the edit page', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'logo@proveedor.com',
    userMetadata: {
      full_name: 'Logo Proveedor',
      account_type: 'provider',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    data: {
      providerCategories: providerCategories.map((category) => ({ ...category })),
      providers: [
        {
          id: 'provider-1',
          owner_id: authState.user.id,
          slug: 'mi-empresa',
          company_name: 'Mi Empresa',
          logo_url: null,
          logo_path: null,
          short_description: 'Servicios industriales.',
          long_description: '',
          category_id: 'cat-automation',
          countries: ['El Salvador'],
          products_services: [],
          website: null,
          contact_email: null,
          status: 'draft_profile',
        },
      ],
    },
    rpc: {
      list_provider_categories: { data: providerCategories },
    },
  })

  // downscaleImage usa createImageBitmap + canvas, no implementados en jsdom.
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
  HTMLCanvasElement.prototype.toBlob = function toBlob(callback: BlobCallback) {
    callback(new Blob(['logo'], { type: 'image/webp' }))
  }

  try {
    await renderApp({
      initialRoute: '/app/provider/edit',
      supabase,
    })

    await screen.findByRole('heading', { name: 'Editar perfil comercial' })
    await screen.findByRole('button', { name: 'Subir logo' })

    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Logo file input not found')
    }
    const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
    await user.upload(fileInput, file)

    await screen.findByText('Logo actualizado.')
  } finally {
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    vi.unstubAllGlobals()
  }
})

it('validates the provider profile form on the client', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'nuevo@proveedor.com',
    userMetadata: {
      full_name: 'Nuevo Proveedor',
      account_type: 'provider',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_provider_categories: { data: providerCategories },
    },
  })

  await renderApp({
    initialRoute: '/app/provider/edit',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Editar perfil comercial' })
  await user.click(screen.getByRole('button', { name: 'Guardar perfil comercial' }))

  expect(await screen.findByText('Ingresa el nombre de la empresa.')).toBeInTheDocument()
  expect(screen.getByText('Selecciona una categoría.')).toBeInTheDocument()
  expect(screen.getByText('Selecciona al menos un país.')).toBeInTheDocument()
  expect(screen.getByText('Agrega una descripción de tu empresa.')).toBeInTheDocument()
  expect(supabase.calls.rpc).not.toContainEqual(
    expect.objectContaining({ fn: 'create_provider_lead' }),
  )

  await user.type(screen.getByLabelText('Empresa'), 'Mi Empresa')
  await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-automation')
  await user.click(screen.getByText('El Salvador'))
  await user.type(screen.getByLabelText('Descripción'), 'Servicios industriales')
  await user.type(screen.getByLabelText('Email de contacto'), 'correo-malo')
  await user.type(screen.getByLabelText('Sitio web'), 'no-es-url')
  await user.click(screen.getByRole('button', { name: 'Guardar perfil comercial' }))

  expect(await screen.findByText('Ingresa un email válido.')).toBeInTheDocument()
  expect(
    screen.getByText('Ingresa una URL válida (incluye https://).'),
  ).toBeInTheDocument()
})

it('paginates the providers directory with a "Mostrar más" control', async () => {
  const many = Array.from({ length: 15 }, (_, index) => ({
    id: `p-${index}`,
    slug: `prov-${index}`,
    company_name: `Proveedor ${index}`,
    logo_url: null,
    short_description: `Descripción ${index}`,
    countries: ['Guatemala'],
    category: providerCategories[0],
  }))
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_provider_categories: { data: providerCategories },
      search_providers: { data: many },
    },
  })

  await renderApp({
    initialRoute: '/proveedores/directorio',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Directorio de proveedores' })
  const results = await screen.findByTestId('providers-results')
  expect(within(results).getByText('Proveedor 0')).toBeInTheDocument()
  expect(within(results).getByText('Proveedor 11')).toBeInTheDocument()
  expect(within(results).queryByText('Proveedor 12')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Mostrar más' }))

  expect(within(results).getByText('Proveedor 12')).toBeInTheDocument()
  expect(within(results).getByText('Proveedor 14')).toBeInTheDocument()
})

it('offers countries from the fixed list even without matching results', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      list_provider_categories: { data: providerCategories },
      search_providers: { data: providerCards },
    },
  })

  await renderApp({
    initialRoute: '/proveedores/directorio',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Directorio de proveedores' })
  const countrySelect = screen.getByLabelText('País')
  // 'Panamá' no aparece en ningún proveedor de prueba, pero sí en la lista fija.
  expect(within(countrySelect).getByRole('option', { name: 'Panamá' })).toBeInTheDocument()
})

it('lets an admin activate a provider from the private moderation view', async () => {
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
  const providers = [
    {
      id: 'provider-lead',
      slug: 'ingenieria-campo',
      company_name: 'Ingeniería de Campo',
      logo_url: 'https://cdn.example.com/ingenieria-de-campo.png',
      short_description: 'Servicios técnicos y consultoría.',
      countries: ['El Salvador'],
      status: 'lead',
      category: providerCategories[1],
    },
  ]
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      list_providers_admin: () => ({
        data: providers,
      }),
      admin_update_provider_status: (args) => {
        const provider = providers.find((entry) => entry.id === args?.provider_id)
        if (provider && typeof args?.next_status === 'string') {
          provider.status = args.next_status as 'lead' | 'draft_profile' | 'active' | 'inactive'
        }
        return { data: provider?.id ?? null }
      },
    },
  })

  await renderApp({
    initialRoute: '/app/providers-admin',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Moderación de proveedores' })
  await screen.findByText('Ingeniería de Campo')
  expect(screen.getByText('lead')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Activar Ingeniería de Campo' }))

  await screen.findByText('active')
  expect(supabase.calls.rpc).toContainEqual({
    fn: 'admin_update_provider_status',
    args: {
      provider_id: 'provider-lead',
      next_status: 'active',
    },
  })
})
