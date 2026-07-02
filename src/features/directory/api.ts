import { getAvatarPublicUrl } from '../../lib/avatar-storage'
import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type {
  DirectoryAggregateSnapshot,
  DirectoryFilters,
  DirectoryProfileCard,
  DirectoryProfileDetail,
  DirectoryProfileExperience,
} from './types'

interface PublicDirectorySummaryRow {
  total_members: number
  total_countries: number
  total_companies: number
  total_specialties: number
}

interface DirectoryProfileRow {
  id: string
  full_name: string
  role_title: string | null
  organization_name: string | null
  country: string | null
  short_bio: string | null
  avatar_path: string | null
  specialties: string[] | null
}

interface DirectoryProfileDetailRow extends DirectoryProfileRow {
  years_experience: number | null
  experiences: DirectoryProfileExperience[] | null
}

async function resolveAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) {
    return null
  }

  return getAvatarPublicUrl(avatarPath)
}

async function mapDirectoryProfile(row: DirectoryProfileRow): Promise<DirectoryProfileCard> {
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: await resolveAvatarUrl(row.avatar_path),
    currentRole: row.role_title ?? '',
    organizationName: row.organization_name ?? '',
    country: row.country ?? '',
    specialties: row.specialties ?? [],
    headline: row.short_bio ?? '',
  }
}

export interface PublicPreviewProfile {
  id: string
  fullName: string
  avatarUrl: string | null
  roleTitle: string
  organizationName: string
  country: string
  specialties: string[]
}

interface PublicPreviewRow {
  id: string
  full_name: string
  avatar_path: string | null
  role_title: string
  organization_name: string
  country: string
  specialties: string[]
}

export async function listPublicPreviewProfiles(limitCount = 12): Promise<PublicPreviewProfile[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('list_public_preview_profiles', {
    limit_count: limitCount,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as PublicPreviewRow[]

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      fullName: row.full_name,
      avatarUrl: await resolveAvatarUrl(row.avatar_path),
      roleTitle: row.role_title,
      organizationName: row.organization_name,
      country: row.country,
      specialties: row.specialties ?? [],
    })),
  )
}

export async function getDirectoryPublicSummary(): Promise<DirectoryAggregateSnapshot> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_public_directory_summary')

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data)
    ? ((data[0] ?? null) as PublicDirectorySummaryRow | null)
    : (data as PublicDirectorySummaryRow | null)

  return {
    totalMembers: Number(row?.total_members ?? 0),
    totalCountries: Number(row?.total_countries ?? 0),
    totalCompanies: Number(row?.total_companies ?? 0),
    totalSpecialties: Number(row?.total_specialties ?? 0),
  }
}

export async function searchDirectoryProfiles(
  filters: Partial<DirectoryFilters> = {},
): Promise<DirectoryProfileCard[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('search_directory_profiles', {
    search_text: filters.searchText?.trim() || null,
    country_filter: filters.country?.trim() || null,
    specialty_slug_filter: filters.specialty?.trim().toLowerCase() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as DirectoryProfileRow[]

  return Promise.all(rows.map(mapDirectoryProfile))
}

export async function getDirectoryProfileDetail(
  profileId: string,
): Promise<DirectoryProfileDetail> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('get_directory_profile_detail', {
    profile_id: profileId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data)
    ? ((data[0] ?? null) as DirectoryProfileDetailRow | null)
    : (data as DirectoryProfileDetailRow | null)

  if (!row) {
    throw new Error('Perfil no encontrado.')
  }

  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: await resolveAvatarUrl(row.avatar_path),
    currentRole: row.role_title ?? '',
    organizationName: row.organization_name ?? '',
    country: row.country ?? '',
    yearsExperience: row.years_experience,
    headline: row.short_bio ?? '',
    shortBio: row.short_bio ?? '',
    specialties: row.specialties ?? [],
    experiences: row.experiences ?? [],
  }
}
