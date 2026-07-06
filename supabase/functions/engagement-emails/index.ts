import { runUnreadReminders } from './jobs/unread-reminders.ts'
import { runInactivityDigests } from './jobs/inactivity-digest.ts'
import { verifyBearerSecret } from '../_shared/verify-secret.ts'

const CRON_SECRET = Deno.env.get('ENGAGEMENT_CRON_SECRET') ?? ''

Deno.serve(async (req: Request) => {
  if (!(await verifyBearerSecret(req, CRON_SECRET))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const [unreadReminders, inactivityDigests] = await Promise.all([
    runUnreadReminders().catch((error) => {
      console.error('[engagement-emails] unread reminders job failed:', error)
      return { sent: 0, error: String(error) }
    }),
    runInactivityDigests().catch((error) => {
      console.error('[engagement-emails] inactivity digest job failed:', error)
      return { sent: 0, error: String(error) }
    }),
  ])

  return Response.json({ unreadReminders, inactivityDigests })
})
