import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

const directoryProfiles = [
  {
    id: 'profile-ana',
    full_name: 'Ana Mejía',
    avatar_path: null,
    role_title: 'Jefa de molinos',
    organization_name: 'Ingenio El Carmen',
    country: 'El Salvador',
    specialties: ['Molinos', 'Energía'],
    verification_status: 'verified',
    short_bio: 'Optimización de molienda y balance energético.',
  },
  {
    id: 'profile-carlos',
    full_name: 'Carlos Ruiz',
    avatar_path: null,
    role_title: 'Supervisor de calderas',
    organization_name: 'Ingenio San Miguel',
    country: 'Guatemala',
    specialties: ['Calderas'],
    verification_status: 'unverified',
    short_bio: 'Operación de calderas y eficiencia térmica.',
  },
  {
    id: 'profile-lucia',
    full_name: 'Lucía Paredes',
    avatar_path: null,
    role_title: 'Especialista en automatización',
    organization_name: 'Ingenio del Pacífico',
    country: 'México',
    specialties: ['Automatización'],
    verification_status: 'verified',
    short_bio: 'Integración de PLC y sensórica industrial.',
  },
]

it('renders the public directory summary without exposing member cards', async () => {
  const supabase = createSupabaseAuthFake({
    rpc: {
      get_public_directory_summary: {
        data: {
          total_members: 10,
          total_countries: 6,
          total_companies: 8,
          total_specialties: 12,
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/directory',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Directorio de la industria azucarera' })
  expect(screen.getByText('10')).toBeInTheDocument()
  expect(screen.getByText('6')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Crear cuenta para explorar perfiles' })).toBeInTheDocument()
  expect(screen.queryByText('Ana Mejía')).not.toBeInTheDocument()
})

it('redirects anonymous users from /app/directory to /login', async () => {
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/app/directory',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Iniciar sesión' })
})

it('filters the private directory and opens a profile detail', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'directory@example.com',
    userMetadata: {
      full_name: 'Directory User',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      search_directory_profiles: (args) => {
        const searchText = String(args?.search_text ?? '')
          .trim()
          .toLowerCase()
        const country = String(args?.country_filter ?? '')
          .trim()
          .toLowerCase()
        const specialty = String(args?.specialty_slug_filter ?? '')
          .trim()
          .toLowerCase()

          const filtered = directoryProfiles.filter((profile) => {
          const matchesSearch =
            !searchText ||
            [profile.full_name, profile.organization_name, ...profile.specialties]
              .join(' ')
              .toLowerCase()
              .includes(searchText)
          const matchesCountry =
            !country || profile.country.toLowerCase() === country
          const matchesSpecialty =
            !specialty ||
            profile.specialties.some(
              (item) => item.toLowerCase() === specialty.replace(/-/g, ' '),
            )

          return matchesSearch && matchesCountry && matchesSpecialty
        })

        return { data: filtered }
      },
      get_directory_profile_detail: (args) => {
        if (args?.profile_id !== 'profile-ana') {
          return {
            data: null,
            error: { message: 'Perfil no encontrado.' },
          }
        }

        return {
            data: {
              id: 'profile-ana',
              full_name: 'Ana Mejía',
              avatar_path: null,
              role_title: 'Jefa de molinos',
              organization_name: 'Ingenio El Carmen',
              country: 'El Salvador',
              years_experience: 12,
              short_bio:
              'Más de una década liderando mejoras de eficiencia en molienda y vapor.',
              specialties: ['Molinos', 'Energía'],
              verification_status: 'verified',
              experiences: [
              {
                id: 'exp-ana-1',
                companyName: 'Ingenio El Carmen',
                roleTitle: 'Jefa de molinos',
                startDate: '2020-01-01',
                endDate: null,
                isCurrent: true,
                description: 'Coordinación de turnos y mejoras de extracción.',
                achievements: 'Reducción de pérdidas de sacarosa.',
              },
            ],
          },
        }
      },
    },
  })

  await renderApp({
    initialRoute: '/app/directory',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Directorio técnico' })
  await screen.findByText('Ana Mejía')
  expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument()

  await user.type(screen.getByLabelText('Buscar perfiles'), 'ana')
  await user.selectOptions(screen.getByLabelText('País'), 'El Salvador')
  await user.selectOptions(screen.getByLabelText('Especialidad'), 'Molinos')

  const results = screen.getByTestId('directory-results')
  expect(within(results).getByText('Ana Mejía')).toBeInTheDocument()
  expect(within(results).queryByText('Carlos Ruiz')).not.toBeInTheDocument()
  expect(within(results).queryByText('Lucía Paredes')).not.toBeInTheDocument()

  await user.click(within(results).getByRole('link', { name: 'Ver perfil de Ana Mejía' }))

  await screen.findByRole('heading', { name: 'Ana Mejía' })
  expect(screen.getByText('Más de una década liderando mejoras de eficiencia en molienda y vapor.')).toBeInTheDocument()
  expect(screen.queryByText(/Email:/)).not.toBeInTheDocument()
  expect(screen.queryByText(/WhatsApp/i)).not.toBeInTheDocument()
})
