import type { VerificationStatus } from '../profile/types'

export interface DirectoryAggregateSnapshot {
  totalMembers: number
  totalCountries: number
  totalCompanies: number
  totalSpecialties: number
}

export interface DirectoryProfileCard {
  id: string
  fullName: string
  avatarUrl: string | null
  currentRole: string
  organizationName: string
  country: string
  specialties: string[]
  isVerified: boolean
  headline: string
}

export interface DirectoryProfileExperience {
  id: string
  companyName: string
  roleTitle: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string
  achievements: string
}

export interface DirectoryProfileDetail {
  id: string
  fullName: string
  avatarUrl: string | null
  currentRole: string
  organizationName: string
  country: string
  yearsExperience: number | null
  headline: string
  shortBio: string
  specialties: string[]
  verificationStatus: VerificationStatus
  experiences: DirectoryProfileExperience[]
}

export interface DirectoryFilters {
  searchText: string
  country: string
  specialty: string
}
