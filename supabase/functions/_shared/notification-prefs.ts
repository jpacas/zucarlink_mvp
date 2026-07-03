import { getAdminClient } from './supabase-admin.ts'

export interface NotificationPreferencesRow {
  user_id: string
  email_unread_reminder: boolean
  email_forum_reply: boolean
  email_liked_topic_reply: boolean
  email_inactivity_digest: boolean
  unsubscribed_all: boolean
  unsubscribe_token: string
}

/** Lazily creates the preferences row (with its unsubscribe token) the first time it's needed. */
export async function ensurePreferences(userId: string): Promise<NotificationPreferencesRow> {
  const admin = getAdminClient()

  await admin
    .from('notification_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })

  const { data, error } = await admin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error(`ensurePreferences failed for ${userId}: ${error?.message}`)
  }

  return data as NotificationPreferencesRow
}

export function buildUnsubscribeUrl(token: string): string {
  return `https://zucarlink.com/preferencias-email?token=${token}`
}
