import type { ProfileDraftInput, ProfileSpecialty, ProfileStatus } from './types'

export function isProfileComplete(
  draft: Pick<
    ProfileDraftInput,
    'country' | 'roleTitle' | 'companyName' | 'yearsExperience' | 'shortBio'
  >,
  specialties: ProfileSpecialty[] | { id: string }[],
) {
  return (
    draft.country.trim().length > 0 &&
    draft.roleTitle.trim().length > 0 &&
    draft.companyName.trim().length > 0 &&
    typeof draft.yearsExperience === 'number' &&
    draft.yearsExperience >= 0 &&
    draft.shortBio.trim().length > 0 &&
    specialties.length > 0
  )
}

export function getProfileStatus(
  draft: Pick<
    ProfileDraftInput,
    'country' | 'roleTitle' | 'companyName' | 'yearsExperience' | 'shortBio'
  >,
  specialties: ProfileSpecialty[] | { id: string }[],
): ProfileStatus {
  return isProfileComplete(draft, specialties) ? 'complete' : 'incomplete'
}
