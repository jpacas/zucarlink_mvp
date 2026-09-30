export type VerificationStatus = 'unverified' | 'pending' | 'verified'

export interface VerifiableProfile {
  id: string
  fullName: string
  country: string
  organizationName: string
  verificationStatus: VerificationStatus
  updatedAt: string | null
}

export interface VerificationLogEntry {
  id: string
  profileId: string
  profileFullName: string
  adminEmail: string
  previousStatus: VerificationStatus
  newStatus: VerificationStatus
  createdAt: string
}
