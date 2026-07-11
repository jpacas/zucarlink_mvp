import { getAvatarPublicUrl } from '../../lib/avatar-storage'
import { logAttachmentCleanupFailure } from '../../lib/attachment-cleanup-log'
import { getForumAttachmentPublicUrl, removeOrphanedForumAttachments } from '../../lib/media-storage'
import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type {
  ForumAttachment,
  ForumAttachmentType,
  ForumCategory,
  ForumReply,
  ForumThreadCard,
  ForumThreadDetail,
  ForumTopicLikeState,
} from './types'

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
  likeCount?: number
  like_count?: number
  viewerLiked?: boolean
  viewer_liked?: boolean
  attachmentPath?: string | null
  attachment_path?: string | null
  attachmentType?: ForumAttachmentType | null
  attachment_type?: ForumAttachmentType | null
  attachmentFilename?: string | null
  attachment_filename?: string | null
  attachmentSizeBytes?: number | null
  attachment_size_bytes?: number | null
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
  attachmentPath?: string | null
  attachment_path?: string | null
  attachmentType?: ForumAttachmentType | null
  attachment_type?: ForumAttachmentType | null
  attachmentFilename?: string | null
  attachment_filename?: string | null
  attachmentSizeBytes?: number | null
  attachment_size_bytes?: number | null
  author: ForumAuthorRow
}

function resolveAttachment(
  path: string | null | undefined,
  type: ForumAttachmentType | null | undefined,
  filename: string | null | undefined,
  sizeBytes: number | null | undefined,
): ForumAttachment | null {
  if (!path || !type) {
    return null
  }

  return {
    url: getForumAttachmentPublicUrl(path) ?? '',
    type,
    filename: filename ?? null,
    sizeBytes: sizeBytes ?? null,
  }
}

interface ForumThreadDetailRow extends ForumThreadRow {
  replies?: ForumReplyRow[] | null
}

async function resolveAvatarUrl(author: ForumAuthorRow) {
  if (author.avatarUrl ?? author.avatar_url) {
    return author.avatarUrl ?? author.avatar_url ?? null
  }

  const avatarPath = author.avatarPath ?? author.avatar_path ?? null

  if (!avatarPath) {
    return null
  }

  return getAvatarPublicUrl(avatarPath)
}

async function mapAuthor(author: ForumAuthorRow) {
  return {
    id: author.id,
    fullName: author.fullName ?? author.full_name ?? 'Miembro Zucarlink',
    roleTitle: author.roleTitle ?? author.role_title ?? '',
    companyName:
      author.companyName ?? author.company_name ?? author.organization_name ?? '',
    avatarUrl: await resolveAvatarUrl(author),
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
    likeCount: Number(row.likeCount ?? row.like_count ?? 0),
    viewerLiked: Boolean(row.viewerLiked ?? row.viewer_liked ?? false),
    attachmentType: row.attachmentType ?? row.attachment_type ?? null,
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
    attachment: resolveAttachment(
      row.attachmentPath ?? row.attachment_path,
      row.attachmentType ?? row.attachment_type,
      row.attachmentFilename ?? row.attachment_filename,
      row.attachmentSizeBytes ?? row.attachment_size_bytes,
    ),
  }
}

export async function listForumCategories(): Promise<ForumCategory[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('list_forum_categories')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
  }))
}

export async function listForumThreads(categorySlug?: string, limitCount?: number) {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('list_forum_threads', {
    category_slug: categorySlug ?? undefined,
    limit_count: limitCount ?? undefined,
  })

  if (error) {
    throw new Error(error.message)
  }

  return Promise.all(((data ?? []) as unknown as ForumThreadRow[]).map(mapThread))
}

export async function getForumThread(threadSlug: string): Promise<ForumThreadDetail> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_forum_thread', {
    thread_slug: threadSlug,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = (Array.isArray(data) ? data[0] : data ?? null) as unknown as ForumThreadDetailRow | null

  if (!row) {
    throw new Error('Tema no encontrado.')
  }

  return {
    ...(await mapThread(row)),
    attachment: resolveAttachment(
      row.attachmentPath ?? row.attachment_path,
      row.attachmentType ?? row.attachment_type,
      row.attachmentFilename ?? row.attachment_filename,
      row.attachmentSizeBytes ?? row.attachment_size_bytes,
    ),
    replies: await Promise.all((row.replies ?? []).map(mapReply)),
  }
}

export async function createForumTopic(payload: {
  categorySlug: string
  title: string
  body: string
  attachmentPath?: string | null
  attachmentType?: ForumAttachmentType | null
  attachmentFilename?: string | null
  attachmentSizeBytes?: number | null
}) {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('create_forum_topic', {
    category_slug: payload.categorySlug,
    title_text: payload.title.trim(),
    body_text: payload.body.trim(),
    attachment_path: payload.attachmentPath ?? undefined,
    attachment_type: payload.attachmentType ?? undefined,
    attachment_filename: payload.attachmentFilename ?? undefined,
    attachment_size_bytes: payload.attachmentSizeBytes ?? undefined,
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
  attachmentPath?: string | null
  attachmentType?: ForumAttachmentType | null
  attachmentFilename?: string | null
  attachmentSizeBytes?: number | null
}) {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('create_forum_reply', {
    thread_slug: payload.threadSlug,
    body_text: payload.body.trim(),
    parent_reply_id: payload.parentReplyId ?? undefined,
    attachment_path: payload.attachmentPath ?? undefined,
    attachment_type: payload.attachmentType ?? undefined,
    attachment_filename: payload.attachmentFilename ?? undefined,
    attachment_size_bytes: payload.attachmentSizeBytes ?? undefined,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteForumTopic(threadSlug: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('delete_forum_topic', {
    thread_slug: threadSlug,
  })

  if (error) {
    throw new Error(error.message)
  }

  const orphanedPaths = (data as string[] | null) ?? []
  if (orphanedPaths.length > 0) {
    void removeOrphanedForumAttachments(orphanedPaths).catch((cause) =>
      logAttachmentCleanupFailure({ path: orphanedPaths, bucket: 'forum-media', cause }),
    )
  }
}

export async function deleteForumReply(replyId: string): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('delete_forum_reply', {
    reply_id: replyId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const orphanedPaths = (data as string[] | null) ?? []
  if (orphanedPaths.length > 0) {
    void removeOrphanedForumAttachments(orphanedPaths).catch((cause) =>
      logAttachmentCleanupFailure({ path: orphanedPaths, bucket: 'forum-media', cause }),
    )
  }
}

interface ForumTopicLikeStateRow {
  like_count?: number | null
  viewer_liked?: boolean | null
}

function mapLikeState(
  data: ForumTopicLikeStateRow[] | ForumTopicLikeStateRow | null,
): ForumTopicLikeState {
  const row = Array.isArray(data) ? (data[0] ?? null) : data
  return {
    likeCount: Number(row?.like_count ?? 0),
    viewerLiked: Boolean(row?.viewer_liked),
  }
}

export async function getForumTopicLikeState(threadSlug: string): Promise<ForumTopicLikeState> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_forum_topic_like_state', {
    thread_slug: threadSlug,
  })

  if (error) {
    throw new Error(error.message)
  }

  return mapLikeState(data)
}

export async function toggleForumTopicLike(threadSlug: string): Promise<ForumTopicLikeState> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('toggle_forum_topic_like', {
    thread_slug: threadSlug,
  })

  if (error) {
    throw new Error(error.message)
  }

  return mapLikeState(data)
}
