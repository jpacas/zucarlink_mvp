import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../../_shared/resend.ts'
import { claimEmail } from '../../_shared/email-log.ts'
import { ensurePreferences, buildUnsubscribeUrl } from '../../_shared/notification-prefs.ts'
import { renderForumReplyNotificationEmail } from '../templates/forum-reply-notification.ts'
import { renderLikedTopicReplyEmail } from '../templates/liked-topic-reply.ts'

interface ForumReplyRow {
  id: string
  topic_id: string
  author_id: string
  body: string
  created_at: string
}

export async function handleForumReply(record: ForumReplyRow): Promise<void> {
  const admin = getAdminClient()

  const { data: topic, error: topicError } = await admin
    .from('forum_topics')
    .select('author_id, title, slug')
    .eq('id', record.topic_id)
    .single()

  if (topicError || !topic) {
    throw new Error(`Forum topic not found: ${topicError?.message}`)
  }

  const { data: replierProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', record.author_id)
    .single()

  const replierName = replierProfile?.full_name ?? 'Un técnico'
  const threadUrl = `https://zucarlink.com/forum/thread/${topic.slug}`

  await notifyTopicAuthor(admin, { record, topic, replierName, threadUrl })
  await notifyLikers(admin, { record, topic, replierName, threadUrl })
}

async function notifyTopicAuthor(
  admin: ReturnType<typeof getAdminClient>,
  opts: {
    record: ForumReplyRow
    topic: { author_id: string; title: string; slug: string }
    replierName: string
    threadUrl: string
  },
): Promise<void> {
  const { record, topic, replierName, threadUrl } = opts

  // Do not notify the topic author about their own reply
  if (topic.author_id === record.author_id) {
    return
  }

  try {
    const prefs = await ensurePreferences(topic.author_id)
    if (prefs.unsubscribed_all || !prefs.email_forum_reply) {
      return
    }

    const { data: topicAuthorUser } = await admin.auth.admin.getUserById(topic.author_id)
    if (!topicAuthorUser?.user?.email) {
      throw new Error(`Cannot resolve email for topic author ${topic.author_id}`)
    }

    const html = renderForumReplyNotificationEmail({
      replierName,
      topicTitle: topic.title,
      replyPreview: record.body,
      threadUrl,
      unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
    })

    await sendEmail({
      to: topicAuthorUser.user.email,
      subject: `${replierName} respondió en tu tema del foro de Zucarlink`,
      html,
    })
  } catch (error) {
    console.error('[on-forum-reply] failed to notify topic author:', error)
  }
}

async function notifyLikers(
  admin: ReturnType<typeof getAdminClient>,
  opts: {
    record: ForumReplyRow
    topic: { author_id: string; title: string; slug: string }
    replierName: string
    threadUrl: string
  },
): Promise<void> {
  const { record, topic, replierName, threadUrl } = opts

  const { data: likers } = await admin
    .from('forum_topic_likes')
    .select('user_id')
    .eq('topic_id', record.topic_id)
    .neq('user_id', record.author_id)
    .neq('user_id', topic.author_id)
    .limit(50)

  for (const liker of likers ?? []) {
    try {
      const claimed = await claimEmail(liker.user_id, 'liked_topic_reply', record.id)
      if (!claimed) continue

      const prefs = await ensurePreferences(liker.user_id)
      if (prefs.unsubscribed_all || !prefs.email_liked_topic_reply) {
        continue
      }

      const { data: likerUser } = await admin.auth.admin.getUserById(liker.user_id)
      if (!likerUser?.user?.email) continue

      const html = renderLikedTopicReplyEmail({
        replierName,
        topicTitle: topic.title,
        replyPreview: record.body,
        threadUrl,
        unsubscribeUrl: buildUnsubscribeUrl(prefs.unsubscribe_token),
      })

      await sendEmail({
        to: likerUser.user.email,
        subject: `Nueva respuesta en un tema del foro que te gustó`,
        html,
      })
    } catch (error) {
      console.error(`[on-forum-reply] failed to notify liker ${liker.user_id}:`, error)
    }
  }
}
