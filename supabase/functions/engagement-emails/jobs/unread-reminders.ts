import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../../_shared/resend.ts'
import { claimEmail, releaseEmail } from '../../_shared/email-log.ts'
import { ensurePreferences, buildUnsubscribeUrl } from '../../_shared/notification-prefs.ts'
import { renderUnreadReminderEmail } from '../templates/unread-reminder.ts'

interface CandidateRow {
  recipient_id: string
  recipient_email: string
  recipient_name: string
  conversation_id: string
  sender_name: string
  unread_count: number
  newest_unread_id: string
  oldest_unread_at: string
  preview: string
}

const MAX_CONVERSATIONS_PER_EMAIL = 5

function dedupeKeyFor(row: CandidateRow): string {
  return `${row.conversation_id}:${row.newest_unread_id}`
}

export async function runUnreadReminders(): Promise<{ sent: number }> {
  const admin = getAdminClient()

  const { data, error } = await admin.rpc('get_unread_reminder_candidates')
  if (error) {
    throw new Error(`get_unread_reminder_candidates failed: ${error.message}`)
  }

  const rows = (data ?? []) as CandidateRow[]
  const byRecipient = new Map<string, CandidateRow[]>()

  for (const row of rows) {
    const list = byRecipient.get(row.recipient_id) ?? []
    list.push(row)
    byRecipient.set(row.recipient_id, list)
  }

  let sent = 0

  for (const [recipientId, conversations] of byRecipient) {
    const claimedConversations: CandidateRow[] = []

    for (const conversation of conversations.slice(0, MAX_CONVERSATIONS_PER_EMAIL)) {
      const claimed = await claimEmail(recipientId, 'unread_reminder', dedupeKeyFor(conversation))
      if (claimed) claimedConversations.push(conversation)
    }

    if (claimedConversations.length === 0) continue

    const prefs = await ensurePreferences(recipientId).catch((prefsError) => {
      console.error(`[engagement-emails] ensurePreferences failed for ${recipientId}:`, prefsError)
      return null
    })

    if (!prefs || prefs.unsubscribed_all || !prefs.email_unread_reminder) {
      for (const conversation of claimedConversations) {
        await releaseEmail(recipientId, 'unread_reminder', dedupeKeyFor(conversation))
      }
      continue
    }

    try {
      const html = renderUnreadReminderEmail({
        recipientName: claimedConversations[0].recipient_name,
        conversations: claimedConversations.map((c) => ({
          senderName: c.sender_name,
          preview: c.preview,
          unreadCount: c.unread_count,
        })),
        unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
      })

      await sendEmail({
        to: claimedConversations[0].recipient_email,
        subject: claimedConversations.length === 1
          ? `${claimedConversations[0].sender_name} te escribió y sigue sin respuesta`
          : `Tienes ${claimedConversations.length} conversaciones sin leer en Zucarlink`,
        html,
      })

      sent += 1
    } catch (sendError) {
      console.error(`[engagement-emails] unread reminder failed for ${recipientId}:`, sendError)
      for (const conversation of claimedConversations) {
        await releaseEmail(recipientId, 'unread_reminder', dedupeKeyFor(conversation))
      }
    }
  }

  return { sent }
}
