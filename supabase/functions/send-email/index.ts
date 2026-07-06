import { handleProviderLead } from './handlers/on-provider-lead.ts'
import { handleProfileComplete } from './handlers/on-profile-complete.ts'
import { handleForumReply } from './handlers/on-forum-reply.ts'
import { verifyBearerSecret } from '../_shared/verify-secret.ts'

const WEBHOOK_SECRET = Deno.env.get('EMAIL_WEBHOOK_SECRET') ?? ''

Deno.serve(async (req: Request) => {
  if (!(await verifyBearerSecret(req, WEBHOOK_SECRET))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: {
    type: string
    table: string
    schema: string
    record: Record<string, unknown>
    old_record: Record<string, unknown> | null
  }

  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { type: eventType, table, record, old_record } = payload

  try {
    if (table === 'provider_leads' && eventType === 'INSERT') {
      await handleProviderLead(record as Parameters<typeof handleProviderLead>[0])
    } else if (table === 'forum_replies' && eventType === 'INSERT') {
      await handleForumReply(record as Parameters<typeof handleForumReply>[0])
    } else if (
      table === 'profiles' &&
      eventType === 'UPDATE' &&
      old_record?.profile_status !== 'complete' &&
      record?.profile_status === 'complete'
    ) {
      await handleProfileComplete(record as Parameters<typeof handleProfileComplete>[0])
    }

    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('[send-email] unhandled error:', error)
    // Return 200 to prevent Supabase from retrying indefinitely
    return new Response('error logged', { status: 200 })
  }
})
