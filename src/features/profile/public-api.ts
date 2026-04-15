import { createAvatarSignedUrl } from '../../lib/avatar-storage'
import { getSupabaseBrowserClient } from '../../lib/supabase'
import type { ForumContribution } from '../forum/types'
import type { PublicMemberProfile, PublicProfileForumActivity } from './types'

interface PublicMemberProfileRow {
  id: string
  full_name: string
  avatar_path: string | null
  role_title: string | null
  organization_name: string | null
  country: string | null
  short_bio: string | null
  verification_status: 'unverified' | 'pending' | 'verified'
}

interface PublicProfileForumActivityRow {
  thread_count?: number
  reply_count?: number
  top_categories?: string[]
  recent_contributions?: Array<{
    id: string
    type: 'thread' | 'reply'
    title: string
    slug: string
    created_at: string
  }>
}

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

export async function getPublicMemberProfile(profileId: string): Promise<PublicMemberProfile> {
  const client = getClient()
  const { data, error } = await client.rpc('get_public_member_profile', {
    profile_id: profileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = (Array.isArray(data) ? data[0] : data ?? null) as PublicMemberProfileRow | null

  if (!row) {
    throw new Error('Perfil no encontrado.')
  }

  const avatarUrl = row.avatar_path
    ? await createAvatarSignedUrl(row.avatar_path).catch(() => null)
    : null

  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl,
    currentRole: row.role_title ?? '',
    organizationName: row.organization_name ?? '',
    country: row.country ?? '',
    shortBio: row.short_bio ?? '',
    verificationStatus: row.verification_status,
  }
}

export async function getProfileForumActivity(profileId: string): Promise<PublicProfileForumActivity> {
  const client = getClient()
  const { data, error } = await client.rpc('get_profile_forum_activity', {
    profile_id: profileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = ((Array.isArray(data) ? data[0] : data) ?? null) as PublicProfileForumActivityRow | null

  return {
    threadCount: Number(row?.thread_count ?? 0),
    replyCount: Number(row?.reply_count ?? 0),
    topCategories: row?.top_categories ?? [],
    recentContributions: (row?.recent_contributions ?? []).map(
      (item): ForumContribution => ({
        id: item.id,
        type: item.type,
        title: item.title,
        slug: item.slug,
        createdAt: item.created_at,
      }),
    ),
  }
}
