import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../resend.ts'
import { renderProviderLeadEmail } from '../templates/provider-lead.ts'

interface ProviderLeadRow {
  id: string
  provider_id: string
  name: string
  email: string
  company: string | null
  message: string
  created_at: string
}

export async function handleProviderLead(record: ProviderLeadRow): Promise<void> {
  const admin = getAdminClient()

  const { data: provider, error } = await admin
    .from('providers')
    .select('company_name, contact_email, owner_id')
    .eq('id', record.provider_id)
    .single()

  if (error || !provider) {
    throw new Error(`Provider not found for lead ${record.id}: ${error?.message}`)
  }

  let toEmail = provider.contact_email
  if (!toEmail) {
    const { data: ownerUser, error: userError } = await admin.auth.admin.getUserById(provider.owner_id)
    if (userError || !ownerUser?.user?.email) {
      throw new Error(`Cannot resolve email for provider owner ${provider.owner_id}`)
    }
    toEmail = ownerUser.user.email
  }

  const html = renderProviderLeadEmail({
    providerCompanyName: provider.company_name,
    leadName: record.name,
    leadEmail: record.email,
    leadCompany: record.company,
    message: record.message,
    createdAt: record.created_at,
  })

  await sendEmail({
    to: toEmail,
    subject: `Nueva solicitud de contacto de ${record.name} — Zucarlink`,
    html,
    replyTo: record.email,
  })
}
