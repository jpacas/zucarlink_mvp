import { getSupabaseBrowserClient } from '../../lib/supabase'
import type {
  ContentItem,
  ContentListFilters,
  EventItem,
  GroupedPriceItems,
  PriceItem,
  PriceMarketSummarySource,
} from './types'

interface ContentItemRow {
  id: string
  type: 'news' | 'blog'
  title: string
  slug: string
  summary: string
  body: string
  category: string
  country?: string | null
  source_name?: string | null
  source_url?: string | null
  cover_image_url?: string | null
  published_at: string
  tags?: string[] | null
  is_featured?: boolean | null
  status: 'draft' | 'published'
}

interface EventItemRow {
  id: string
  title: string
  slug: string
  summary: string
  start_date: string
  end_date?: string | null
  city?: string | null
  country?: string | null
  organizer?: string | null
  source_url?: string | null
  cover_image_url?: string | null
  tags?: string[] | null
  status: 'draft' | 'published'
}

interface PriceItemRow {
  id: string
  label: string
  value: string
  value_numeric?: number | string | null
  unit?: string | null
  observed_at: string
  source_name?: string | null
  source_url?: string | null
  notes?: string | null
  status: 'draft' | 'published'
  featured?: boolean | null
  market_summary?: string | null
  market_summary_sources?: PriceMarketSummarySource[] | null
  market_summary_updated_at?: string | null
}

function getClient() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}

function mapContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    category: row.category as ContentItem['category'],
    country: row.country ?? undefined,
    sourceName: row.source_name ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    publishedAt: row.published_at,
    tags: row.tags ?? [],
    isFeatured: row.is_featured ?? false,
    status: row.status,
  }
}

function mapEventItem(row: EventItemRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    organizer: row.organizer ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    tags: row.tags ?? [],
    status: row.status,
  }
}

function mapPriceItem(row: PriceItemRow): PriceItem {
  const valueNumeric =
    row.value_numeric === null || row.value_numeric === undefined
      ? undefined
      : Number(row.value_numeric)

  return {
    id: row.id,
    label: row.label,
    value: row.value,
    valueNumeric: valueNumeric !== undefined && Number.isFinite(valueNumeric) ? valueNumeric : undefined,
    unit: row.unit ?? undefined,
    observedAt: row.observed_at,
    sourceName: row.source_name ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    featured: row.featured ?? false,
    marketSummary: row.market_summary ?? undefined,
    marketSummarySources: row.market_summary_sources ?? undefined,
    marketSummaryUpdatedAt: row.market_summary_updated_at ?? undefined,
  }
}

export async function listPublishedContent(
  type: 'news' | 'blog',
  filters: ContentListFilters = {},
): Promise<ContentItem[]> {
  const client = getClient()
  let query = client
    .from('content_items')
    .select()
    .eq('type', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const rows = ((data ?? []) as ContentItemRow[]).filter((row) => {
    if (!filters.query) {
      return true
    }

    const queryText = filters.query.trim().toLowerCase()
    return (
      row.title.toLowerCase().includes(queryText) ||
      row.summary.toLowerCase().includes(queryText) ||
      (row.tags ?? []).some((tag) => tag.toLowerCase().includes(queryText))
    )
  })

  return rows.map(mapContentItem)
}

export async function getPublishedContentBySlug(slug: string): Promise<ContentItem> {
  const client = getClient()
  const { data, error } = await client
    .from('content_items')
    .select()
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Contenido no encontrado.')
  }

  return mapContentItem(data as ContentItemRow)
}

export async function listPublishedEvents(): Promise<EventItem[]> {
  const client = getClient()
  const { data, error } = await client
    .from('events')
    .select()
    .eq('status', 'published')
    .order('start_date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as EventItemRow[]).map(mapEventItem)
}

export async function listPublishedPrices(): Promise<PriceItem[]> {
  const client = getClient()
  const { data, error } = await client
    .from('price_items')
    .select()
    .eq('status', 'published')
    .order('observed_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as PriceItemRow[]).map(mapPriceItem)
}

export async function listFeaturedContent(limitCount?: number): Promise<ContentItem[]> {
  const client = getClient()
  const { data, error } = await client
    .from('content_items')
    .select()
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as ContentItemRow[]
  const limitedRows = typeof limitCount === 'number' ? rows.slice(0, limitCount) : rows
  return limitedRows.map(mapContentItem)
}

export function groupPriceSeries(items: PriceItem[]): GroupedPriceItems {
  const byLabel = new Map<string, PriceItem[]>()

  for (const item of items) {
    const group = byLabel.get(item.label)
    if (group) {
      group.push(item)
    } else {
      byLabel.set(item.label, [item])
    }
  }

  const featured: GroupedPriceItems['featured'] = []
  const others: GroupedPriceItems['others'] = []

  for (const [label, group] of byLabel) {
    const mostRecent = group.reduce((latest, item) =>
      item.observedAt > latest.observedAt ? item : latest,
    )

    if (mostRecent.featured) {
      const history = [...group].sort((a, b) => a.observedAt.localeCompare(b.observedAt))
      featured.push({ label, history })
    } else {
      others.push(...group)
    }
  }

  others.sort((a, b) => b.observedAt.localeCompare(a.observedAt))

  return { featured, others }
}
