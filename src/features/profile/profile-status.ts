import type { ProfileDraftInput, ProfileSpecialty, ProfileStatus } from './types'

export interface ProfileCompletenessResult {
  percent: number
  missingFields: Array<{ label: string; editPath: string }>
}

const REQUIRED_FIELDS: Array<{
  key: keyof Pick<ProfileDraftInput, 'country' | 'roleTitle' | 'companyName' | 'shortBio'>
  label: string
  editPath: string
}> = [
  { key: 'roleTitle', label: 'Cargo actual', editPath: '/app/profile/edit#roleTitle' },
  { key: 'companyName', label: 'Empresa o ingenio', editPath: '/app/profile/edit#companyName' },
  { key: 'country', label: 'País', editPath: '/app/profile/edit#country' },
  { key: 'shortBio', label: 'Resumen profesional', editPath: '/app/profile/edit#shortBio' },
]

export function getProfileCompleteness(
  draft: Pick<ProfileDraftInput, 'country' | 'roleTitle' | 'companyName' | 'yearsExperience' | 'shortBio'>,
  specialties: ProfileSpecialty[] | { id: string }[],
): ProfileCompletenessResult {
  const missingFields: ProfileCompletenessResult['missingFields'] = []

  for (const field of REQUIRED_FIELDS) {
    if (!draft[field.key]?.trim()) {
      missingFields.push({ label: field.label, editPath: field.editPath })
    }
  }

  const hasSpecialty = specialties.length > 0
  if (!hasSpecialty) {
    missingFields.push({ label: 'Al menos una especialidad técnica', editPath: '/app/profile/edit#specialties' })
  }

  const totalFields = REQUIRED_FIELDS.length + 1 // +1 for specialties
  const completedFields = totalFields - missingFields.length
  const percent = Math.round((completedFields / totalFields) * 100)

  return { percent, missingFields }
}

export function isProfileComplete(
  draft: Pick<ProfileDraftInput, 'country' | 'roleTitle' | 'companyName' | 'shortBio'>,
  specialties: ProfileSpecialty[] | { id: string }[],
) {
  return (
    draft.country.trim().length > 0 &&
    draft.roleTitle.trim().length > 0 &&
    draft.companyName.trim().length > 0 &&
    draft.shortBio.trim().length > 0 &&
    specialties.length > 0
  )
}

export function getProfileStatus(
  draft: Pick<ProfileDraftInput, 'country' | 'roleTitle' | 'companyName' | 'shortBio'>,
  specialties: ProfileSpecialty[] | { id: string }[],
): ProfileStatus {
  return isProfileComplete(draft, specialties) ? 'complete' : 'incomplete'
}
