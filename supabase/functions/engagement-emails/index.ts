import { runUnreadReminders } from './jobs/unread-reminders.ts'
import { runInactivityDigests } from './jobs/inactivity-digest.ts'

const CRON_SECRET = Deno.env.get('ENGAGEMENT_CRON_SECRET') ?? ''

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
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
