import { getAvatarPublicUrl } from '../../lib/avatar-storage'
import { getMessageAttachmentSignedUrl } from '../../lib/media-storage'
import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type { Message, MessageAttachmentType, MessageThread } from './types'

async function resolveAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null
  return getAvatarPublicUrl(avatarPath)
}

export async function countMyUnread(): Promise<number> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('count_my_unread')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? 0
}

export async function listMyThreads(): Promise<MessageThread[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('list_my_threads')

  if (error) {
    throw new Error(error.message)
  }

  const rows = data ?? []

  return Promise.all(
    rows.map(async (row) => ({
      threadId: row.thread_id,
      otherProfileId: row.other_profile_id,
      otherFullName: row.other_full_name,
      otherAvatarPath: await resolveAvatarUrl(row.other_avatar_path),
      lastMessageBody: row.last_message_body,
      lastMessageAt: row.last_message_at,
      lastMessageAttachmentType:
        (row.last_message_attachment_type as MessageAttachmentType | null) ?? null,
      unreadCount: row.unread_count,
    })),
  )
}

export async function startOrGetThread(otherProfileId: string): Promise<string> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('start_or_get_thread', {
    other_profile_id: otherProfileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}

interface AttachmentRow {
  path: string
  type: string
  filename: string | null
  size_bytes: number | null
}

async function resolveMessageAttachments(rows: AttachmentRow[] | null | undefined): Promise<Message['attachments']> {
  const list = rows ?? []
  return Promise.all(
    list.map(async (row) => ({
      url: (await getMessageAttachmentSignedUrl(row.path)) ?? '',
      type: row.type as MessageAttachmentType,
      filename: row.filename ?? null,
      sizeBytes: row.size_bytes ?? null,
    })),
  )
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_thread_messages', {
    p_thread_id: threadId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return Promise.all(
    (data ?? []).map(async (row) => ({
      id: row.id,
      senderId: row.sender_id,
      body: row.body,
      isRead: row.is_read,
      createdAt: row.created_at,
      attachments: await resolveMessageAttachments(
        (row.attachments as unknown as AttachmentRow[] | null) ?? [],
      ),
    })),
  )
}

export async function sendMessage(
  threadId: string,
  body: string,
  attachments?: Array<{
    path: string
    type: MessageAttachmentType
    filename?: string | null
    sizeBytes?: number | null
  }>,
): Promise<string> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('send_message', {
    p_thread_id: threadId,
    body_text: body,
    attachments: (attachments ?? []).map((a) => ({
      path: a.path,
      type: a.type,
      filename: a.filename ?? null,
      size_bytes: a.sizeBytes ?? null,
    })),
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}

export async function markThreadRead(threadId: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.rpc('mark_thread_read', {
    p_thread_id: threadId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function clearThread(threadId: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.rpc('clear_thread', {
    p_thread_id: threadId,
  })

  if (error) {
    throw new Error(error.message)
  }
}
