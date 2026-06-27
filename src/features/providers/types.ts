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
  brands: string[]
  category: ProviderCategory
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
  // Descripción única (texto separado por comas no aplica aquí). Las marcas y los
  // productos se manejan como cadenas separadas por comas, igual que `countries`.
  description: string
  brands: string
  productsServices: string
  website: string
  contactEmail: string
}

export interface SiteMeta {
  title: string
  description: string
  image: string
}

export interface CurrentProviderProfile extends ProviderProfileDraft {
  id: string
  slug: string
  ownerId: string
  logoUrl: string | null
  logoPath: string | null
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

export type ProviderLeadStatus = 'new' | 'reviewed' | 'contacted' | 'closed'

export interface ProviderLead {
  id: string
  providerId: string
  name: string
  email: string
  company: string | null
  message: string
  status: ProviderLeadStatus
  createdAt: string
}
