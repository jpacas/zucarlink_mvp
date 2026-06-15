import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../resend.ts'
import { renderWelcomeEmail } from '../templates/welcome.ts'

interface ProfileRow {
  id: string
  full_name: string
  account_type: 'technician' | 'provider'
}

export async function handleProfileComplete(record: ProfileRow): Promise<void> {
  const admin = getAdminClient()

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
