import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../resend.ts'
import { renderMessageNotificationEmail } from '../templates/message-notification.ts'

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

const ACTIVE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export async function handleMessage(record: MessageRow): Promise<void> {
  const admin = getAdminClient()

  const { data: conversation, error: convError } = await admin
    .from('conversations')
    .select('participant_one_id, participant_two_id')
    .eq('id', record.conversation_id)
    .single()

  if (convError || !conversation) {
    throw new Error(`Conversation not found: ${convError?.message}`)
  }

  const recipientId = record.sender_id === conversation.participant_one_id
    ? conversation.participant_two_id
    : conversation.participant_one_id

  // Suppress notification if recipient was recently active in this thread
  const recentCutoff = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString()
  const { data: recentMessages } = await admin
    .from('messages')
    .select('id')
    .eq('conversation_id', record.conversation_id)
    .eq('sender_id', recipientId)
    .gte('created_at', recentCutoff)
    .limit(1)

  if (recentMessages && recentMessages.length > 0) {
    return // recipient was recently active, skip notification
  }

  const [{ data: senderProfile }, { data: recipientUser }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', record.sender_id).single(),
    admin.auth.admin.getUserById(recipientId),
  ])

  if (!recipientUser?.user?.email) {
    throw new Error(`Cannot resolve email for recipient ${recipientId}`)
  }

  const senderName = senderProfile?.full_name ?? 'Un técnico'

  const html = renderMessageNotificationEmail({
    senderName,
    messagePreview: record.body,
  })

  await sendEmail({
    to: recipientUser.user.email,
    subject: `${senderName} te envió un mensaje en Zucarlink`,
    html,
  })
}
