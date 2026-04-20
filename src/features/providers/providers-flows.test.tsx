import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

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
    is_verified: true,
  },
  {
    id: 'provider-lab',
    slug: 'lab-cana',
    company_name: 'Lab Caña',
    logo_url: 'https://cdn.example.com/lab-cana.png',
    short_description: 'Servicios de laboratorio y control de calidad.',
    countries: ['México'],
    category: providerCategories[1],
    is_verified: false,
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
            is_verified: true,
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
          is_verified: true,
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
          is_verified: true,
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
          is_verified: true,
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

it('lets an admin activate a provider from the private moderation view', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'admin@zucarlink.com',
    userMetadata: {
      full_name: 'Admin Zucarlink',
      account_type: 'technician',
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
      is_verified: false,
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
