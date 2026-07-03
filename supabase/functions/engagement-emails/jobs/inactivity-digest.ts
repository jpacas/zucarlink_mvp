import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../../_shared/resend.ts'
import { claimEmail, releaseEmail } from '../../_shared/email-log.ts'
import { ensurePreferences, buildUnsubscribeUrl } from '../../_shared/notification-prefs.ts'
import { renderInactivityDigestEmail, type DigestContent } from '../templates/inactivity-digest.ts'

interface CandidateRow {
  user_id: string
  email: string
  full_name: string
  account_type: 'technician' | 'provider'
  last_seen_at: string
}

function isEmptyDigest(content: DigestContent): boolean {
  return (
    content.unread_messages === 0 &&
    content.my_topics_activity.length === 0 &&
    content.liked_topics_activity.length === 0 &&
    content.popular_new_topics.length === 0
  )
}

export async function runInactivityDigests(): Promise<{ sent: number }> {
  const admin = getAdminClient()

  const { data, error } = await admin.rpc('get_inactivity_digest_candidates')
  if (error) {
    throw new Error(`get_inactivity_digest_candidates failed: ${error.message}`)
  }

  const rows = (data ?? []) as CandidateRow[]
  const todayKey = new Date().toISOString().slice(0, 10)
  let sent = 0

  for (const candidate of rows) {
    const claimed = await claimEmail(candidate.user_id, 'inactivity_digest', todayKey)
    if (!claimed) continue

    try {
      const { data: content, error: contentError } = await admin.rpc('get_digest_content', {
        p_user_id: candidate.user_id,
        p_since: candidate.last_seen_at,
      })

      if (contentError || !content) {
        throw new Error(`get_digest_content failed: ${contentError?.message}`)
      }

      const digest = content as DigestContent

      if (isEmptyDigest(digest)) {
        await releaseEmail(candidate.user_id, 'inactivity_digest', todayKey)
        continue
      }

      const prefs = await ensurePreferences(candidate.user_id)
      if (prefs.unsubscribed_all || !prefs.email_inactivity_digest) {
        await releaseEmail(candidate.user_id, 'inactivity_digest', todayKey)
        continue
      }

      const html = renderInactivityDigestEmail({
        fullName: candidate.full_name,
        accountType: candidate.account_type,
        digest,
        unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
      })

      await sendEmail({
        to: candidate.email,
        subject: 'Esto pasó en Zucarlink mientras no estabas',
        html,
      })

      sent += 1
    } catch (jobError) {
      console.error(`[engagement-emails] inactivity digest failed for ${candidate.user_id}:`, jobError)
      await releaseEmail(candidate.user_id, 'inactivity_digest', todayKey)
    }
  }

  return { sent }
}
