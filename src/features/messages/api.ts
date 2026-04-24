import { createAvatarSignedUrl } from '../../lib/avatar-storage'
import { getSupabaseBrowserClient } from '../../lib/supabase'
import type { Message, MessageThread } from './types'

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

interface ThreadRow {
  thread_id: string
  other_profile_id: string
  other_full_name: string
  other_avatar_path: string | null
  other_verification_status: string
  last_message_body: string
  last_message_at: string | null
  unread_count: number
}

interface MessageRow {
  id: string
  sender_id: string
  body: string
  is_read: boolean
  created_at: string
}

async function resolveAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null
  return createAvatarSignedUrl(avatarPath).catch(() => null)
}

export async function listMyThreads(): Promise<MessageThread[]> {
  const client = getClient()
  const { data, error } = await client.rpc('list_my_threads')

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as ThreadRow[]

  return Promise.all(
    rows.map(async (row) => ({
      threadId: row.thread_id,
      otherProfileId: row.other_profile_id,
      otherFullName: row.other_full_name,
      otherAvatarPath: await resolveAvatarUrl(row.other_avatar_path),
      otherVerificationStatus: (row.other_verification_status as MessageThread['otherVerificationStatus']) ?? 'unverified',
      lastMessageBody: row.last_message_body,
      lastMessageAt: row.last_message_at,
      unreadCount: row.unread_count,
    })),
  )
}

export async function startOrGetThread(otherProfileId: string): Promise<string> {
  const client = getClient()
  const { data, error } = await client.rpc('start_or_get_thread', {
    other_profile_id: otherProfileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const client = getClient()
  const { data, error } = await client.rpc('get_thread_messages', {
    p_thread_id: threadId,
  })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as MessageRow[]).map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))
}

export async function sendMessage(threadId: string, body: string): Promise<string> {
  const client = getClient()
  const { data, error } = await client.rpc('send_message', {
    p_thread_id: threadId,
    body_text: body,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}

export async function markThreadRead(threadId: string): Promise<void> {
  const client = getClient()
  const { error } = await client.rpc('mark_thread_read', {
    p_thread_id: threadId,
  })

  if (error) {
    throw new Error(error.message)
  }
}
