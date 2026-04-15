import type { AccountType } from '../../types/auth'

export type ProfileStatus = 'incomplete' | 'complete'
export type VerificationStatus = 'unverified' | 'pending' | 'verified'

export interface ProfileSpecialty {
  id: string
  name: string
  slug: string
}

export interface ProfileExperience {
  id: string
  companyName: string
  roleTitle: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string
  achievements: string
}

export interface CurrentProfile {
  id: string
  email: string | null
  accountType: AccountType
  fullName: string
  country: string
  roleTitle: string
  companyName: string
  yearsExperience: number | null
  shortBio: string
  avatarPath: string | null
  avatarUrl: string | null
  phone: string
  whatsapp: string
  linkedinUrl: string
  profileStatus: ProfileStatus
  verificationStatus: VerificationStatus
  specialties: ProfileSpecialty[]
  experiences: ProfileExperience[]
}

export interface ProfileDraftInput {
  fullName: string
  country: string
  roleTitle: string
  companyName: string
  yearsExperience: number | null
  shortBio: string
  phone: string
  whatsapp: string
  linkedinUrl: string
}

export interface ExperienceInput {
  id?: string
  companyName: string
  roleTitle: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string
  achievements: string
}
