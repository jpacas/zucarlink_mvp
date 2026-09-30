import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { renderApp } from '../../test/render-app'
import { createAuthenticatedAuthState, createSupabaseAuthFake } from '../../test/fakes/supabase'

it('redeems a referral code from the URL right after signup, without blocking or erroring', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    rpc: {
      redeem_referral_code: (args) => {
        expect(args?.p_code).toBe('ABC123XYZ0')
        return { data: true }
      },
    },
  })

  await renderApp({
    initialRoute: '/register?ref=ABC123XYZ0',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Crear cuenta' })
  await user.type(screen.getByLabelText('Nombre completo'), 'Referred Tech')
  await user.type(screen.getByLabelText('Email'), 'referred@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Semana4Test123')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  await screen.findByRole('heading', { name: 'Completa tu perfil técnico' })

  expect(supabase.calls.rpc).toContainEqual({
    fn: 'redeem_referral_code',
    args: { p_code: 'ABC123XYZ0', p_referred_id: expect.any(String) },
  })
})

it('never surfaces an error when the referral code is invalid or the RPC fails', async () => {
  const user = userEvent.setup()
  const supabase = createSupabaseAuthFake({
    rpc: {
      redeem_referral_code: () => ({ error: { message: 'boom' } }),
    },
  })

  await renderApp({
    initialRoute: '/register?ref=INVALIDCODE',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Crear cuenta' })
  await user.type(screen.getByLabelText('Nombre completo'), 'Referred Tech')
  await user.type(screen.getByLabelText('Email'), 'referred2@example.com')
  await user.type(screen.getByLabelText('Contraseña'), 'Semana4Test123')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

  await screen.findByRole('heading', { name: 'Completa tu perfil técnico' })
  expect(screen.queryByText('boom')).not.toBeInTheDocument()
})

it('shows the invite link and lets an authenticated technician copy it', async () => {
  const authState = createAuthenticatedAuthState({
    email: 'referrer@example.com',
    userMetadata: {
      full_name: 'Referrer Tech',
      account_type: 'technician',
    },
  })
  const user = userEvent.setup()
  const writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })

  const supabase = createSupabaseAuthFake({
    session: authState.session,
    user: authState.user,
    rpc: {
      get_my_referral_summary: () => ({
        data: [{ code: 'DEADBEEF01', redemption_count: 2 }],
      }),
    },
  })

  await renderApp({
    initialRoute: '/app/profile',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Invitar colegas' })
  await screen.findByText('2 personas se unieron con tu invitación.')

  await user.click(screen.getByRole('button', { name: 'Compartir' }))
  await user.click(screen.getByRole('menuitem', { name: 'Copiar enlace' }))

  await screen.findByText('Enlace de invitación copiado')
  expect(writeText).toHaveBeenCalledWith('https://www.zucarlink.com/register?ref=DEADBEEF01')
})
