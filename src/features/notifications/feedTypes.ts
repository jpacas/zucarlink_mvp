export type NotificationType = 'forum_reply' | 'topic_liked'

export interface NotificationItem {
  id: string
  type: NotificationType
  actorName: string
  topicTitle: string
  topicSlug: string
  readAt: string | null
  createdAt: string
}
