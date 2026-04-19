export type ProviderStatus = 'lead' | 'draft_profile' | 'active' | 'inactive'

export interface ProviderCategory {
  id: string
  slug: string
  name: string
}

export interface ProviderCard {
  id: string
  slug: string
  companyName: string
  logoUrl: string | null
  shortDescription: string
  countries: string[]
  category: ProviderCategory
  isVerified: boolean
}

export interface ProviderDetail extends ProviderCard {
  longDescription: string
  productsServices: string[]
  website: string | null
  contactEmail: string | null
  status: ProviderStatus
}

export interface AdminProviderRecord extends ProviderCard {
  status: ProviderStatus
}

export interface ProviderProfileDraft {
  companyName: string
  categoryId: string
  countries: string
  shortDescription: string
  longDescription: string
  productsServices: string
  website: string
  contactEmail: string
}

export interface CurrentProviderProfile extends ProviderProfileDraft {
  id: string
  slug: string
  ownerId: string
  logoUrl: string | null
  isVerified: boolean
  status: ProviderStatus
  category: ProviderCategory | null
}

export interface ProviderLeadInput {
  providerId: string
  name: string
  email: string
  company: string
  message: string
}
