import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

import { renderApp } from '../../test/render-app'
import {
  createAuthenticatedAuthState,
  createSupabaseAuthFake,
} from '../../test/fakes/supabase'

const dashboardPayload = {
  period_days: 30,
  generated_at: '2026-04-20T12:00:00.000Z',
  kpis: {
    new_users: 12,
    technician_users: 9,
    provider_users: 3,
    complete_profiles: 7,
    incomplete_profiles: 5,
    verified_profiles: 2,
    pending_profiles: 1,
    forum_topics: 4,
    forum_replies: 18,
    active_providers: 5,
    provider_leads: 6,
    published_content: 11,
  },
  weekly_signups: [
    { week_start: '2026-04-06', user_count: 5 },
    { week_start: '2026-04-13', user_count: 7 },
  ],
  account_types: [
    { account_type: 'technician', user_count: 9 },
    { account_type: 'provider', user_count: 3 },
  ],
  countries: [
    { country: 'Guatemala', user_count: 6 },
    { country: 'El Salvador', user_count: 4 },
  ],
  companies: [
    { company_name: 'Ingenio Central', user_count: 4 },
    { company_name: 'Ingenio La Unión', user_count: 2 },
  ],
  profile_statuses: [
    { profile_status: 'complete', user_count: 7 },
    { profile_status: 'incomplete', user_count: 5 },
  ],
  verification_statuses: [
    { verification_status: 'verified', user_count: 2 },
    { verification_status: 'pending', user_count: 1 },
    { verification_status: 'unverified', user_count: 9 },
  ],
  forum_categories: [
    { category_name: 'Molienda', topic_count: 3, reply_count: 12 },
    { category_name: 'Automatización', topic_count: 1, reply_count: 6 },
  ],
  recent_forum_topics: [
    {
      id: 'topic-1',
      title: 'Pérdidas en extracción',
      category_name: 'Molienda',
      author_name: 'Ana Técnica',
      reply_count: 8,
      last_activity_at: '2026-04-19T14:00:00.000Z',
    },
  ],
  provider_statuses: [
    { status: 'active', provider_count: 5 },
    { status: 'draft_profile', provider_count: 2 },
  ],
  provider_leads_by_provider: [
    { provider_name: 'Tecno Control', lead_count: 4 },
    { provider_name: 'Lab Caña', lead_count: 2 },
  ],
  recent_provider_leads: [
    {
      id: 'lead-1',
      provider_name: 'Tecno Control',
      lead_name: 'Compras Ingenio Central',
      lead_company: 'Ingenio Central',
      status: 'new',
      created_at: '2026-04-18T09:30:00.000Z',
    },
  ],
  content_statuses: [
    { content_group: 'blog', status: 'published', item_count: 6 },
    { content_group: 'events', status: 'draft', item_count: 2 },
  ],
}

it('lets an admin open the operational dashboard and switch the reporting period', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'admin@zucarlink.com',
    userMetadata: {
      full_name: 'Admin Zucarlink',
      account_type: 'technician',
      is_admin: true,
    },
  })
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_admin_operational_dashboard: (args) => ({
        data: {
          ...dashboardPayload,
          period_days: Number(args?.period_days ?? 30),
        },
      }),
    },
  })

  await renderApp({
    initialRoute: '/app',
    supabase,
  })

  await user.click(await screen.findByRole('link', { name: 'Dashboard gerencial' }))
  await screen.findByText('Usuarios nuevos')

  expect(screen.getByText('Últimos 30 días')).toBeInTheDocument()
  expect(screen.getByText('Usuarios nuevos')).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Ingenio Central')).toBeInTheDocument()
  expect(screen.getByText('Pérdidas en extracción')).toBeInTheDocument()
  expect(screen.getByText('Compras Ingenio Central')).toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Periodo'), '90')

  await screen.findByText('Últimos 90 días')
  expect(supabase.calls.rpc).toContainEqual({
    fn: 'get_admin_operational_dashboard',
    args: {
      period_days: 90,
    },
  })
})

it('keeps the operational dashboard hidden from non-admin users', async () => {
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
    initialRoute: '/app/admin/dashboard',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Tu espacio en Zucarlink' })
  expect(screen.queryByRole('link', { name: 'Dashboard gerencial' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Dashboard gerencial' })).not.toBeInTheDocument()
})

it('shows a useful dashboard error when the admin RPC fails', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'admin@zucarlink.com',
    userMetadata: {
      full_name: 'Admin Zucarlink',
      account_type: 'technician',
      is_admin: true,
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_admin_operational_dashboard: {
        error: { message: 'Permisos insuficientes' },
      },
    },
  })

  await renderApp({
    initialRoute: '/app/admin/dashboard',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Dashboard gerencial' })
  expect(screen.getByText('Permisos insuficientes')).toBeInTheDocument()
})

it('renders empty operational dashboard states without breaking', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'admin@zucarlink.com',
    userMetadata: {
      full_name: 'Admin Zucarlink',
      account_type: 'technician',
      is_admin: true,
    },
  })
  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_admin_operational_dashboard: {
        data: {
          ...dashboardPayload,
          countries: [],
          companies: [],
          recent_forum_topics: [],
          recent_provider_leads: [],
          provider_leads_by_provider: [],
        },
      },
    },
  })

  await renderApp({
    initialRoute: '/app/admin/dashboard',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Dashboard gerencial' })
  const rankings = await screen.findByTestId('admin-dashboard-rankings')

  expect(within(rankings).getAllByText('Sin datos para este periodo.')).toHaveLength(2)
  expect(screen.getAllByText('No hay registros recientes para este periodo.')).toHaveLength(2)
})
