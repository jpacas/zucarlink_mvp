import type { User } from '@supabase/supabase-js'

import {
  createAvatarSignedUrl,
  removeAvatar,
  uploadAvatar,
} from '../../lib/avatar-storage'
import { getSupabaseBrowserClient } from '../../lib/supabase'
import { getCurrentProviderProfile } from '../providers/api'
import type {
  CurrentProfile,
  ExperienceInput,
  ProfileDraftInput,
  ProfileExperience,
  ProfileSpecialty,
} from './types'
import { getProfileStatus } from './profile-status'

interface ProfileRow {
  id: string
  account_type: 'technician' | 'provider'
  full_name: string
  country: string | null
  role_title: string | null
  current_company_id: string | null
  years_experience: number | null
  short_bio: string | null
  avatar_path: string | null
  phone: string | null
  whatsapp: string | null
  linkedin_url: string | null
  profile_status: 'incomplete' | 'complete'
  verification_status: 'unverified' | 'pending' | 'verified'
}

interface CompanyRow {
  id: string
  name: string
}

interface ExperienceRow {
  id: string
  company_id: string | null
  role_title: string
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  achievements: string | null
}

interface ProfileSpecialtyRow {
  specialty_id: string
}

interface SpecialtyRow {
  id: string
  name: string
  slug: string
}

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

async function ensureCompanyId(companyName: string, country: string) {
  const cleanName = companyName.trim()

  if (!cleanName) {
    return null
  }

  const client = getClient()
  const { data: existing, error: existingError } = await client
    .from('companies')
    .select('id, name')
    .eq('name', cleanName)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    return existing.id
  }

  const { data: created, error: createError } = await client
    .from('companies')
    .insert({
      name: cleanName,
      country: country.trim() || null,
    })
    .select('id, name')
    .single()

  if (createError) {
    throw new Error(createError.message)
  }

  return created.id
}

async function loadCompaniesByIds(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, CompanyRow>()
  }

  const client = getClient()
  const { data, error } = await client
    .from('companies')
    .select('id, name')
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((company) => [company.id, company]))
}

async function loadProfileSpecialties(profileId: string) {
  const client = getClient()
  const { data: links, error: linksError } = await client
    .from('profile_specialties')
    .select('specialty_id')
    .eq('profile_id', profileId)

  if (linksError) {
    throw new Error(linksError.message)
  }

  const specialtyIds = (links ?? []).map((item: ProfileSpecialtyRow) => item.specialty_id)

  if (specialtyIds.length === 0) {
    return [] satisfies ProfileSpecialty[]
  }

  const { data: specialties, error: specialtiesError } = await client
    .from('specialties')
    .select('id, name, slug')
    .in('id', specialtyIds)

  if (specialtiesError) {
    throw new Error(specialtiesError.message)
  }

  const byId = new Map(
    (specialties ?? []).map((item: SpecialtyRow) => [
      item.id,
      {
        id: item.id,
        name: item.name,
        slug: item.slug,
      },
    ]),
  )

  return specialtyIds
    .map((specialtyId) => byId.get(specialtyId))
    .filter((item): item is ProfileSpecialty => Boolean(item))
}

async function loadExperiences(profileId: string) {
  const client = getClient()
  const { data, error } = await client
    .from('experiences')
    .select(
      'id, company_id, role_title, start_date, end_date, is_current, description, achievements',
    )
    .eq('profile_id', profileId)
    .order('start_date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ExperienceRow[]
}

function mapExperience(
  row: ExperienceRow,
  companies: Map<string, CompanyRow>,
): ProfileExperience {
  return {
    id: row.id,
    companyName: row.company_id ? (companies.get(row.company_id)?.name ?? '') : '',
    roleTitle: row.role_title,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    description: row.description ?? '',
    achievements: row.achievements ?? '',
  }
}

export async function getCurrentProfile(user: User): Promise<CurrentProfile | null> {
  const client = getClient()
  const { data, error } = await client
    .from('profiles')
    .select(
      'id, account_type, full_name, country, role_title, current_company_id, years_experience, short_bio, avatar_path, phone, whatsapp, linkedin_url, profile_status, verification_status',
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const profile = data as ProfileRow
  const [specialties, experiences] = await Promise.all([
    loadProfileSpecialties(user.id),
    loadExperiences(user.id),
  ])
  const companyIds = new Set<string>()

  if (profile.current_company_id) {
    companyIds.add(profile.current_company_id)
  }

  for (const experience of experiences) {
    if (experience.company_id) {
      companyIds.add(experience.company_id)
    }
  }

  const companies = await loadCompaniesByIds([...companyIds])
  const avatarUrl = profile.avatar_path
    ? await createAvatarSignedUrl(profile.avatar_path).catch(() => null)
    : null

  return {
    id: profile.id,
    email: user.email ?? null,
    accountType: profile.account_type,
    fullName: profile.full_name,
    country: profile.country ?? '',
    roleTitle: profile.role_title ?? '',
    companyName: profile.current_company_id
      ? (companies.get(profile.current_company_id)?.name ?? '')
      : '',
    yearsExperience: profile.years_experience,
    shortBio: profile.short_bio ?? '',
    avatarPath: profile.avatar_path,
    avatarUrl,
    phone: profile.phone ?? '',
    whatsapp: profile.whatsapp ?? '',
    linkedinUrl: profile.linkedin_url ?? '',
    profileStatus: profile.profile_status,
    verificationStatus: profile.verification_status,
    specialties,
    experiences: experiences.map((experience) => mapExperience(experience, companies)),
  }
}

export async function listSpecialties() {
  const client = getClient()
  const { data, error } = await client
    .from('specialties')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ProfileSpecialty[]
}

export async function saveProfileDraft(
  userId: string,
  payload: ProfileDraftInput,
  specialtyIds: string[],
) {
  const client = getClient()
  const companyId = await ensureCompanyId(payload.companyName, payload.country)
  const status = getProfileStatus(payload, specialtyIds.map((id) => ({ id })))

  const { error } = await client
    .from('profiles')
    .update({
      full_name: payload.fullName.trim(),
      country: payload.country.trim() || null,
      role_title: payload.roleTitle.trim() || null,
      current_company_id: companyId,
      years_experience: payload.yearsExperience,
      short_bio: payload.shortBio.trim() || null,
      phone: payload.phone.trim() || null,
      whatsapp: payload.whatsapp.trim() || null,
      linkedin_url: payload.linkedinUrl.trim() || null,
      profile_status: status,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  await replaceProfileSpecialties(userId, specialtyIds)
}

export async function replaceProfileSpecialties(userId: string, specialtyIds: string[]) {
  const client = getClient()
  const { error: deleteError } = await client
    .from('profile_specialties')
    .delete()
    .eq('profile_id', userId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (specialtyIds.length === 0) {
    return
  }

  const { error: insertError } = await client.from('profile_specialties').insert(
    specialtyIds.map((specialtyId) => ({
      profile_id: userId,
      specialty_id: specialtyId,
    })),
  )

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function saveExperience(userId: string, payload: ExperienceInput) {
  const client = getClient()
  const companyId = await ensureCompanyId(payload.companyName, '')
  const changes = {
    profile_id: userId,
    company_id: companyId,
    role_title: payload.roleTitle.trim(),
    start_date: payload.startDate,
    end_date: payload.isCurrent ? null : payload.endDate,
    is_current: payload.isCurrent,
    description: payload.description.trim() || null,
    achievements: payload.achievements.trim() || null,
  }

  if (payload.id) {
    const { error } = await client
      .from('experiences')
      .update(changes)
      .eq('id', payload.id)
      .eq('profile_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return payload.id
  }

  const { data, error } = await client
    .from('experiences')
    .insert(changes)
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.id as string
}

export async function deleteExperience(userId: string, experienceId: string) {
  const client = getClient()
  const { error } = await client
    .from('experiences')
    .delete()
    .eq('id', experienceId)
    .eq('profile_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function saveAvatarForProfile(userId: string, file: File, currentPath?: string | null) {
  if (currentPath) {
    await removeAvatar(currentPath).catch(() => undefined)
  }

  const upload = await uploadAvatar({
    file,
    userId,
  })

  const client = getClient()
  const { error } = await client
    .from('profiles')
    .update({
      avatar_path: upload.path,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return createAvatarSignedUrl(upload.path)
}

export async function resolvePostAuthDestination(user: User) {
  const profile = await getCurrentProfile(user)

  if (!profile) {
    return '/onboarding'
  }

  if (profile.accountType === 'provider') {
    const providerProfile = await getCurrentProviderProfile(user)
    return providerProfile ? '/app/provider' : '/onboarding'
  }

  return profile.profileStatus === 'complete' ? '/app/profile' : '/onboarding'
}
