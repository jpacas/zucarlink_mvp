import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../../_shared/resend.ts'
import { renderWelcomeEmail } from '../templates/welcome.ts'
import { claimEmail } from '../../_shared/email-log.ts'

interface ProfileRow {
  id: string
  full_name: string
  account_type: 'technician' | 'provider'
}

export async function handleProfileComplete(record: ProfileRow): Promise<void> {
  const admin = getAdminClient()

  // Guard de idempotencia: los webhooks de Supabase entregan "at least once",
  // así que un reintento puede volver a disparar esta transición. dedupe_key
  // fijo (no hay una fecha/ronda que lo particione, a diferencia de los
  // digests) porque solo debe enviarse una vez por perfil, siempre.
  const claimed = await claimEmail(record.id, 'welcome', 'once')
  if (!claimed) return

  const { data: userResponse, error } = await admin.auth.admin.getUserById(record.id)
  if (error || !userResponse?.user?.email) {
    throw new Error(`Cannot resolve email for profile ${record.id}`)
  }

  const html = renderWelcomeEmail({
    fullName: record.full_name,
    accountType: record.account_type,
  })

  await sendEmail({
    to: userResponse.user.email,
    subject: `Bienvenido/a a Zucarlink, ${record.full_name.split(' ')[0]}`,
    html,
  })
}
