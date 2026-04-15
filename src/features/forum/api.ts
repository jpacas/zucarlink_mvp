import { createAvatarSignedUrl } from '../../lib/avatar-storage'
import { getSupabaseBrowserClient } from '../../lib/supabase'
import type { ForumCategory, ForumReply, ForumThreadCard, ForumThreadDetail } from './types'

interface ForumAuthorRow {
  id: string
  fullName?: string
  full_name?: string
  roleTitle?: string | null
  role_title?: string | null
  companyName?: string | null
  company_name?: string | null
  organization_name?: string | null
  avatarUrl?: string | null
  avatar_url?: string | null
  avatarPath?: string | null
  avatar_path?: string | null
  verificationStatus?: 'unverified' | 'pending' | 'verified'
  verification_status?: 'unverified' | 'pending' | 'verified'
}

interface ForumCategoryRow {
  id: string
  slug: string
  name: string
  description?: string | null
}

interface ForumThreadRow {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  body: string
  category: {
    slug: string
    name: string
  }
  author: ForumAuthorRow
  replyCount?: number
  reply_count?: number
  createdAt?: string
  created_at?: string
  lastActivityAt?: string
  last_activity_at?: string
}

interface ForumReplyRow {
  id: string
  body: string
  createdAt?: string
  created_at?: string
  parentReplyId?: string | null
  parent_reply_id?: string | null
  parentAuthorName?: string | null
  parent_author_name?: string | null
  author: ForumAuthorRow
}

interface ForumThreadDetailRow extends ForumThreadRow {
  replies?: ForumReplyRow[] | null
}

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

async function resolveAvatarUrl(author: ForumAuthorRow) {
  if (author.avatarUrl ?? author.avatar_url) {
    return author.avatarUrl ?? author.avatar_url ?? null
  }

  const avatarPath = author.avatarPath ?? author.avatar_path ?? null

  if (!avatarPath) {
    return null
  }

  return createAvatarSignedUrl(avatarPath).catch(() => null)
}

async function mapAuthor(author: ForumAuthorRow) {
  return {
    id: author.id,
    fullName: author.fullName ?? author.full_name ?? 'Miembro Zucarlink',
    roleTitle: author.roleTitle ?? author.role_title ?? '',
    companyName:
      author.companyName ?? author.company_name ?? author.organization_name ?? '',
    avatarUrl: await resolveAvatarUrl(author),
    verificationStatus:
      author.verificationStatus ?? author.verification_status ?? 'unverified',
  }
}

async function mapThread(row: ForumThreadRow): Promise<ForumThreadCard> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? row.body,
    body: row.body,
    category: row.category,
    author: await mapAuthor(row.author),
    replyCount: Number(row.replyCount ?? row.reply_count ?? 0),
    createdAt: row.createdAt ?? row.created_at ?? '',
    lastActivityAt: row.lastActivityAt ?? row.last_activity_at ?? '',
  }
}

async function mapReply(row: ForumReplyRow): Promise<ForumReply> {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt ?? row.created_at ?? '',
    parentReplyId: row.parentReplyId ?? row.parent_reply_id ?? null,
    parentAuthorName: row.parentAuthorName ?? row.parent_author_name ?? null,
    author: await mapAuthor(row.author),
  }
}

export async function listForumCategories(): Promise<ForumCategory[]> {
  const client = getClient()
  const { data, error } = await client.rpc('list_forum_categories')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as ForumCategoryRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
  }))
}

export async function listForumThreads(categorySlug?: string, limitCount?: number) {
  const client = getClient()
  const { data, error } = await client.rpc('list_forum_threads', {
    category_slug: categorySlug ?? null,
    limit_count: limitCount ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return Promise.all(((data ?? []) as ForumThreadRow[]).map(mapThread))
}

export async function getForumThread(threadSlug: string): Promise<ForumThreadDetail> {
  const client = getClient()
  const { data, error } = await client.rpc('get_forum_thread', {
    thread_slug: threadSlug,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = (Array.isArray(data) ? data[0] : data ?? null) as ForumThreadDetailRow | null

  if (!row) {
    throw new Error('Tema no encontrado.')
  }

  return {
    ...(await mapThread(row)),
    replies: await Promise.all((row.replies ?? []).map(mapReply)),
  }
}

export async function createForumTopic(payload: {
  categorySlug: string
  title: string
  body: string
}) {
  const client = getClient()
  const { data, error } = await client.rpc('create_forum_topic', {
    category_slug: payload.categorySlug,
    title_text: payload.title.trim(),
    body_text: payload.body.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  return (Array.isArray(data) ? data[0] : data) as { slug: string }
}

export async function createForumReply(payload: {
  threadSlug: string
  body: string
  parentReplyId?: string | null
}) {
  const client = getClient()
  const { data, error } = await client.rpc('create_forum_reply', {
    thread_slug: payload.threadSlug,
    body_text: payload.body.trim(),
    parent_reply_id: payload.parentReplyId ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
