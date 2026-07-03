import { getSupabaseClientOrThrow } from '../../lib/supabase'

export interface NotificationPreferences {
  emailUnreadReminder: boolean
  emailForumReply: boolean
  emailLikedTopicReply: boolean
  emailInactivityDigest: boolean
  unsubscribedAll: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailUnreadReminder: true,
  emailForumReply: true,
  emailLikedTopicReply: true,
  emailInactivityDigest: true,
  unsubscribedAll: false,
}

function toPreferences(row: {
  email_unread_reminder: boolean
  email_forum_reply: boolean
  email_liked_topic_reply: boolean
  email_inactivity_digest: boolean
  unsubscribed_all: boolean
}): NotificationPreferences {
  return {
    emailUnreadReminder: row.email_unread_reminder,
    emailForumReply: row.email_forum_reply,
    emailLikedTopicReply: row.email_liked_topic_reply,
    emailInactivityDigest: row.email_inactivity_digest,
    unsubscribedAll: row.unsubscribed_all,
  }
}

function toRowPayload(partial: Partial<NotificationPreferences>): Record<string, boolean> {
  const payload: Record<string, boolean> = {}

  if (partial.emailUnreadReminder !== undefined) payload.email_unread_reminder = partial.emailUnreadReminder
  if (partial.emailForumReply !== undefined) payload.email_forum_reply = partial.emailForumReply
  if (partial.emailLikedTopicReply !== undefined) payload.email_liked_topic_reply = partial.emailLikedTopicReply
  if (partial.emailInactivityDigest !== undefined) payload.email_inactivity_digest = partial.emailInactivityDigest
  if (partial.unsubscribedAll !== undefined) payload.unsubscribed_all = partial.unsubscribedAll

  return payload
}

export async function getMyNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client
    .from('notification_preferences')
    .select('email_unread_reminder, email_forum_reply, email_liked_topic_reply, email_inactivity_digest, unsubscribed_all')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? toPreferences(data) : DEFAULT_PREFERENCES
}

export async function updateMyNotificationPreferences(
  userId: string,
  partial: Partial<NotificationPreferences>,
): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client
    .from('notification_preferences')
    .upsert({ user_id: userId, ...toRowPayload(partial) }, { onConflict: 'user_id' })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getEmailPrefsByToken(token: string): Promise<NotificationPreferences | null> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_email_prefs_by_token', { p_token: token })

  if (error) {
    throw new Error(error.message)
  }

  const row = data?.[0]
  return row ? toPreferences(row) : null
}

export async function updateEmailPrefsByToken(
  token: string,
  partial: Partial<NotificationPreferences>,
): Promise<boolean> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('update_email_prefs_by_token', {
    p_token: token,
    p_prefs: toRowPayload(partial),
  })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? false
}
