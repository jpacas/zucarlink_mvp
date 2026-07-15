import { getAvatarPublicUrl } from '../../lib/avatar-storage'
import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type { ForumContribution } from '../forum/types'
import type { PublicMemberProfile, PublicProfileForumActivity } from './types'

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

export async function getPublicMemberProfile(profileId: string): Promise<PublicMemberProfile> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_public_member_profile', {
    profile_id: profileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)

  if (!row) {
    throw new Error('Perfil no encontrado.')
  }

  const avatarUrl = row.avatar_path ? getAvatarPublicUrl(row.avatar_path) : null

  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl,
    currentRole: row.role_title ?? '',
    organizationName: row.organization_name ?? '',
    country: row.country ?? '',
    shortBio: row.short_bio ?? '',
    // Defensivo: la migración 20260715000050 agrega `specialties`; antes de
    // aplicarla el RPC no devuelve el campo y la ficha simplemente lo omite.
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    isVerified: row.verification_status === 'verified',
  }
}

export async function getProfileForumActivity(profileId: string): Promise<PublicProfileForumActivity> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_profile_forum_activity', {
    profile_id: profileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = ((Array.isArray(data) ? data[0] : data) ?? null) as unknown as PublicProfileForumActivityRow | null

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
