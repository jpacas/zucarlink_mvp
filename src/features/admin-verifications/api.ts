import { getSupabaseClientOrThrow } from '../../lib/supabase'
import type { VerifiableProfile, VerificationLogEntry, VerificationStatus } from './types'

interface VerifiableProfileRow {
  id: string
  full_name: string
  country: string
  organization_name: string
  verification_status: VerificationStatus
  updated_at: string | null
}

interface VerificationLogRow {
  id: string
  profile_id: string
  profile_full_name: string
  admin_email: string
  previous_status: VerificationStatus
  new_status: VerificationStatus
  created_at: string
}

export async function searchVerifiableProfiles(
  searchText: string,
  statusFilter: VerificationStatus | null = null,
): Promise<VerifiableProfile[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('admin_search_verifiable_profiles', {
    search_text: searchText.trim() || undefined,
    status_filter: statusFilter ?? undefined,
    limit_count: 30,
  })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as VerifiableProfileRow[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    country: row.country,
    organizationName: row.organization_name,
    verificationStatus: row.verification_status,
    updatedAt: row.updated_at,
  }))
}

export async function updateVerification(
  profileId: string,
  newStatus: Extract<VerificationStatus, 'verified' | 'unverified'>,
): Promise<void> {
  const client = getSupabaseClientOrThrow()
  const { error } = await client.rpc('admin_update_verification', {
    p_profile_id: profileId,
    p_new_status: newStatus,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function listVerificationLog(): Promise<VerificationLogEntry[]> {
  const client = getSupabaseClientOrThrow()
  const { data, error } = await client.rpc('admin_list_verification_log', {
    limit_count: 30,
  })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as VerificationLogRow[]).map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    profileFullName: row.profile_full_name,
    adminEmail: row.admin_email,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    createdAt: row.created_at,
  }))
}
