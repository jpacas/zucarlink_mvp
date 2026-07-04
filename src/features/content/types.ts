export type ContentType = 'news' | 'blog'

export type ContentStatus = 'draft' | 'published'

export type ContentCategory =
  | 'Mercado'
  | 'Tecnología'
  | 'Producción'
  | 'Agrícola'
  | 'Energía'
  | 'Mantenimiento'
  | 'Sostenibilidad'
  | 'Regulación'
  | 'Automatización'
  | 'Eventos'
  | 'Innovación'

export interface ContentItem {
  id: string
  type: ContentType
  title: string
  slug: string
  summary: string
  body: string
  category: ContentCategory
  publishedAt: string
  tags: string[]
  status: ContentStatus
  sourceName?: string
  sourceUrl?: string
  coverImageUrl?: string
  country?: string
  isFeatured?: boolean
}

export interface EventItem {
  id: string
  title: string
  slug: string
  summary: string
  startDate: string
  endDate?: string
  city?: string
  country?: string
  organizer?: string
  sourceUrl?: string
  coverImageUrl?: string
  tags: string[]
  status: ContentStatus
}

export interface PriceMarketSummarySource {
  label: string
  url: string
}

export interface PriceItem {
  id: string
  label: string
  value: string
  valueNumeric?: number
  observedAt: string
  status: ContentStatus
  unit?: string
  sourceName?: string
  sourceUrl?: string
  notes?: string
  featured?: boolean
}

export interface PriceSeries {
  label: string
  history: PriceItem[]
}

export interface PriceMarketSummary {
  id: string
  label: string
  periodStart: string
  periodEnd: string
  summary: string
  sources: PriceMarketSummarySource[]
}

export interface GroupedPriceItems {
  featured: PriceSeries[]
  others: PriceItem[]
}

export interface ContentListFilters {
  query?: string
  category?: ContentCategory
  tags?: string[]
}

export interface FeaturedContentBlock {
  title: string
  items: ContentItem[]
}
