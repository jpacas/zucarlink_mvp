import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../resend.ts'
import { renderForumReplyNotificationEmail } from '../templates/forum-reply-notification.ts'

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

  // Do not notify the topic author about their own reply
  if (topic.author_id === record.author_id) {
    return
  }

  const [{ data: replierProfile }, { data: topicAuthorUser }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', record.author_id).single(),
    admin.auth.admin.getUserById(topic.author_id),
  ])

  if (!topicAuthorUser?.user?.email) {
    throw new Error(`Cannot resolve email for topic author ${topic.author_id}`)
  }

  const replierName = replierProfile?.full_name ?? 'Un técnico'
  const threadUrl = `https://zucarlink.com/forum/thread/${topic.slug}`

  const html = renderForumReplyNotificationEmail({
    replierName,
    topicTitle: topic.title,
    replyPreview: record.body,
    threadUrl,
  })

  await sendEmail({
    to: topicAuthorUser.user.email,
    subject: `${replierName} respondió en tu tema del foro de Zucarlink`,
    html,
  })
}
