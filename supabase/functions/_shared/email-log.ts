import { getAdminClient } from './supabase-admin.ts'

export type EngagementEmailType = 'unread_reminder' | 'inactivity_digest' | 'liked_topic_reply'

/**
 * Claims the right to send an email for (userId, emailType, dedupeKey).
 * Returns false if it was already sent (unique violation on the log table),
 * so callers can skip sending without a redundant lookup query first.
 */
export async function claimEmail(
  userId: string,
  emailType: EngagementEmailType,
  dedupeKey: string,
): Promise<boolean> {
  const admin = getAdminClient()
  const { error } = await admin
    .from('engagement_email_log')
    .insert({ user_id: userId, email_type: emailType, dedupe_key: dedupeKey })

  if (!error) return true
  if (error.code === '23505') return false
  throw new Error(`claimEmail failed for ${userId}/${emailType}: ${error.message}`)
}

/** Releases a claim so the next run retries, used when the actual send fails. */
export async function releaseEmail(
  userId: string,
  emailType: EngagementEmailType,
  dedupeKey: string,
): Promise<void> {
  const admin = getAdminClient()
  await admin
    .from('engagement_email_log')
    .delete()
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .eq('dedupe_key', dedupeKey)
}
