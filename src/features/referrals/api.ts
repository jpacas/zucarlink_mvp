import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type { ReferralSummary } from './types'

export async function getMyReferralSummary(): Promise<ReferralSummary | null> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_my_referral_summary')

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    return null
  }

  return { code: row.code, redemptionCount: row.redemption_count }
}

// Nunca debe bloquear ni mostrar error al usuario que se está registrando:
// código inválido o auto-referido simplemente no acreditan nada (ver T14).
export async function redeemReferralCode(code: string, referredId: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  await client.rpc('redeem_referral_code', { p_code: code, p_referred_id: referredId })
}
