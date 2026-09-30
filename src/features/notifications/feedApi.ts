import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type { NotificationItem, NotificationType } from './feedTypes'

interface NotificationRow {
  id: string
  type: NotificationType
  actor_name: string
  topic_title: string
  topic_slug: string
  read_at: string | null
  created_at: string
}

function toNotificationItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    actorName: row.actor_name,
    topicTitle: row.topic_title,
    topicSlug: row.topic_slug,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function countMyUnreadNotifications(): Promise<number> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('count_my_unread_notifications')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? 0
}

export async function getMyNotifications(limitCount = 20): Promise<NotificationItem[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_my_notifications', { limit_count: limitCount })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as NotificationRow[]).map(toNotificationItem)
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  })

  if (error) {
    throw new Error(error.message)
  }
}
