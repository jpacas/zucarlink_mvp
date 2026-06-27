import type { User } from '@supabase/supabase-js'

import { getSupabaseBrowserClient } from '../../lib/supabase'
import { getLogoPublicUrl, removeLogo, uploadProviderLogo } from '../../lib/logo-storage'
import type {
  AdminProviderRecord,
  CurrentProviderProfile,
  ProviderCard,
  ProviderCategory,
  ProviderDetail,
  ProviderLead,
  ProviderLeadInput,
  ProviderLeadStatus,
  ProviderProfileDraft,
  ProviderStatus,
} from './types'

interface ProviderCategoryRow {
  id: string
  slug: string
  name: string
}

interface ProviderCardRow {
  id: string
  slug: string
  company_name: string
  logo_url: string | null
  short_description: string | null
  countries: string[] | null
  category: ProviderCategoryRow
}

interface ProviderDetailRow extends ProviderCardRow {
  long_description: string | null
  products_services: string[] | null
  website: string | null
  contact_email: string | null
  status: ProviderStatus
}

interface AdminProviderRow extends ProviderCardRow {
  status: ProviderStatus
}

interface ProviderRow {
  id: string
  owner_id: string
  slug: string | null
  company_name: string
  logo_url: string | null
  logo_path: string | null
  short_description: string | null
  long_description: string | null
  category_id: string | null
  countries: string[] | null
  products_services: string[] | null
  website: string | null
  contact_email: string | null
  status: ProviderStatus
}

interface ProviderLeadRow {
  id: string
  provider_id: string
  name: string
  email: string
  company: string | null
  message: string
  status: ProviderLeadStatus
  created_at: string
}

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapCategory(row: ProviderCategoryRow): ProviderCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
  }
}

function mapCard(row: ProviderCardRow): ProviderCard {
  return {
    id: row.id,
    slug: row.slug,
    companyName: row.company_name,
    logoUrl: row.logo_url,
    shortDescription: row.short_description ?? '',
    countries: row.countries ?? [],
    category: mapCategory(row.category),
  }
}

function mapDetail(row: ProviderDetailRow): ProviderDetail {
  return {
    ...mapCard(row),
    longDescription: row.long_description ?? '',
    productsServices: row.products_services ?? [],
    website: row.website,
    contactEmail: row.contact_email,
    status: row.status,
  }
}

function mapLead(row: ProviderLeadRow): ProviderLead {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    email: row.email,
    company: row.company,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }
}

export async function listProviderCategories(): Promise<ProviderCategory[]> {
  const client = getClient()
  const { data, error } = await client.rpc('list_provider_categories')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as ProviderCategoryRow[]).map(mapCategory)
}

export async function searchProviders(filters?: {
  searchText?: string
  categorySlug?: string
  country?: string
}): Promise<ProviderCard[]> {
  const client = getClient()
  const { data, error } = await client.rpc('search_providers', {
    search_text: filters?.searchText?.trim() || null,
    category_slug: filters?.categorySlug?.trim().toLowerCase() || null,
    country_filter: filters?.country?.trim() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as ProviderCardRow[]).map(mapCard)
}

export async function getProviderBySlug(slug: string): Promise<ProviderDetail> {
  const client = getClient()
  const { data, error } = await client.rpc('get_provider_by_slug', {
    provider_slug: slug,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = (Array.isArray(data) ? data[0] : data ?? null) as ProviderDetailRow | null

  if (!row) {
    throw new Error('Proveedor no encontrado.')
  }

  return mapDetail(row)
}

export async function listAdminProviders(): Promise<AdminProviderRecord[]> {
  const client = getClient()
  const { data, error } = await client.rpc('list_providers_admin')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as AdminProviderRow[]).map((row) => ({
    ...mapCard(row),
    status: row.status,
  }))
}

export async function updateProviderStatus(providerId: string, nextStatus: ProviderStatus) {
  const client = getClient()
  const { error } = await client.rpc('admin_update_provider_status', {
    provider_id: providerId,
    next_status: nextStatus,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentProviderProfile(
  user: User,
): Promise<CurrentProviderProfile | null> {
  const client = getClient()
  const { data, error } = await client
    .from('providers')
    .select(
      'id, owner_id, slug, company_name, logo_url, logo_path, short_description, long_description, category_id, countries, products_services, website, contact_email, status',
    )
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const provider = data as ProviderRow
  let category: ProviderCategory | null = null

  if (provider.category_id) {
    const { data: categoryData, error: categoryError } = await client
      .from('provider_categories')
      .select('id, slug, name')
      .eq('id', provider.category_id)
      .maybeSingle()

    if (categoryError) {
      throw new Error(categoryError.message)
    }

    if (categoryData) {
      category = mapCategory(categoryData as ProviderCategoryRow)
    }
  }

  return {
    id: provider.id,
    ownerId: provider.owner_id,
    slug: provider.slug ?? slugify(provider.company_name),
    companyName: provider.company_name,
    logoUrl: provider.logo_url,
    logoPath: provider.logo_path,
    shortDescription: provider.short_description ?? '',
    longDescription: provider.long_description ?? '',
    categoryId: provider.category_id ?? '',
    category,
    countries: (provider.countries ?? []).join(', '),
    productsServices: (provider.products_services ?? []).join(', '),
    website: provider.website ?? '',
    contactEmail: provider.contact_email ?? user.email ?? '',
    status: provider.status,
  }
}

export async function saveProviderProfile(
  user: User,
  payload: ProviderProfileDraft,
  nextStatus: ProviderStatus,
) {
  const client = getClient()
  const cleanCountries = payload.countries
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const cleanProducts = payload.productsServices
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const baseRow = {
    owner_id: user.id,
    company_name: payload.companyName.trim(),
    short_description: payload.shortDescription.trim() || null,
    long_description: payload.longDescription.trim() || null,
    category_id: payload.categoryId || null,
    countries: cleanCountries,
    products_services: cleanProducts,
    website: payload.website.trim() || null,
    contact_email: payload.contactEmail.trim() || null,
    status: nextStatus,
  }

  const { data: existing, error: existingError } = await client
    .from('providers')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    const { error } = await client.from('providers').update(baseRow).eq('owner_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await client.from('providers').insert({
    ...baseRow,
    slug: slugify(payload.companyName),
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function createProviderLead(payload: ProviderLeadInput) {
  const client = getClient()
  const { error } = await client.rpc('create_provider_lead', {
    provider_id: payload.providerId,
    name_text: payload.name.trim(),
    email_text: payload.email.trim(),
    company_text: payload.company.trim() || null,
    message_text: payload.message.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function listProviderLeads(): Promise<ProviderLead[]> {
  const client = getClient()
  const { data, error } = await client.rpc('list_provider_leads')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as ProviderLeadRow[]).map(mapLead)
}

export async function updateProviderLeadStatus(
  leadId: string,
  nextStatus: ProviderLeadStatus,
) {
  const client = getClient()
  const { error } = await client.rpc('update_provider_lead_status', {
    lead_id: leadId,
    next_status: nextStatus,
  })

  if (error) {
    throw new Error(error.message)
  }
}

// Sube el logo del proveedor (comprimido en cliente), borra el anterior y guarda en
// `providers` tanto la URL pública (logo_url, que sirven las RPCs) como el path
// (logo_path, usado para limpiar el archivo al reemplazarlo). Requiere que el perfil
// de proveedor ya exista.
export async function saveLogoForProvider(
  user: User,
  file: File,
  currentPath?: string | null,
): Promise<{ path: string; publicUrl: string | null }> {
  if (currentPath) {
    await removeLogo(currentPath).catch(() => undefined)
  }

  const { path } = await uploadProviderLogo({ file, userId: user.id })
  const publicUrl = getLogoPublicUrl(path)

  const client = getClient()
  const { error } = await client
    .from('providers')
    .update({ logo_path: path, logo_url: publicUrl })
    .eq('owner_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  return { path, publicUrl }
}

export function createEmptyProviderDraft(): ProviderProfileDraft {
  return {
    companyName: '',
    categoryId: '',
    countries: '',
    shortDescription: '',
    longDescription: '',
    productsServices: '',
    website: '',
    contactEmail: '',
  }
}

export function isProviderDraftComplete(payload: ProviderProfileDraft) {
  return Boolean(
    payload.companyName.trim() &&
      payload.categoryId &&
      payload.countries.trim() &&
      payload.shortDescription.trim(),
  )
}
