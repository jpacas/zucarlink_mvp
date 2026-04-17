import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'

import { ContentCard } from './components/ContentCard'
import { ContentFilters } from './components/ContentFilters'
import { EventCard } from './components/EventCard'
import { FeaturedContent } from './components/FeaturedContent'
import { PriceCard } from './components/PriceCard'
import { SectionHeader } from './components/SectionHeader'
import { TagBadge } from './components/TagBadge'
import { renderApp } from '../../test/render-app'
import { createSupabaseAuthFake } from '../../test/fakes/supabase'

async function loadApiWithFake(
  supabase: ReturnType<typeof createSupabaseAuthFake>,
) {
  vi.resetModules()
  const supabaseModule = await import('../../lib/supabase')
  vi.spyOn(supabaseModule, 'getSupabaseBrowserClient').mockImplementation(
    () => supabase as never,
  )

  return import('./api')
}

it('lists only published news content ordered by published date descending', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Cierre temprano de zafra en Centroamérica',
          slug: 'cierre-temprano-zafra',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Mercado',
          published_at: '2026-04-14T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Fuente 1',
          source_url: 'https://example.com/1',
          is_featured: false,
        },
        {
          id: 'news-2',
          type: 'news',
          title: 'Nuevo récord de cogeneración',
          slug: 'record-cogeneracion',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Energía',
          published_at: '2026-04-15T12:00:00.000Z',
          tags: ['cogeneración'],
          status: 'published',
          source_name: 'Fuente 2',
          source_url: 'https://example.com/2',
          is_featured: true,
        },
        {
          id: 'news-3',
          type: 'news',
          title: 'Borrador oculto',
          slug: 'borrador-oculto',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Mercado',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['mercado'],
          status: 'draft',
          source_name: 'Fuente 3',
          source_url: 'https://example.com/3',
          is_featured: false,
        },
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Artículo técnico',
          slug: 'articulo-tecnico',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Tecnología',
          published_at: '2026-04-15T10:00:00.000Z',
          tags: ['automatización'],
          status: 'published',
          source_name: 'Fuente 4',
          source_url: 'https://example.com/4',
          is_featured: false,
        },
      ],
    },
  })

  const { listPublishedContent } = await loadApiWithFake(supabase)

  const items = await listPublishedContent('news')

  expect(items.map((item) => item.slug)).toEqual([
    'record-cogeneracion',
    'cierre-temprano-zafra',
  ])
})

it('lists only published blog content ordered by published date descending', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Mantenimiento predictivo',
          slug: 'mantenimiento-predictivo',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Tecnología',
          published_at: '2026-04-12T12:00:00.000Z',
          tags: ['mantenimiento'],
          status: 'published',
          source_name: 'Fuente 1',
          source_url: 'https://example.com/1',
          is_featured: false,
        },
        {
          id: 'blog-2',
          type: 'blog',
          title: 'Optimización de molinos',
          slug: 'optimizacion-molinos',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Producción',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['molienda'],
          status: 'published',
          source_name: 'Fuente 2',
          source_url: 'https://example.com/2',
          is_featured: true,
        },
        {
          id: 'news-1',
          type: 'news',
          title: 'Noticia no listada aquí',
          slug: 'noticia-separada',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Mercado',
          published_at: '2026-04-17T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Fuente 3',
          source_url: 'https://example.com/3',
          is_featured: false,
        },
      ],
    },
  })

  const { listPublishedContent } = await loadApiWithFake(supabase)

  const items = await listPublishedContent('blog')

  expect(items.map((item) => item.slug)).toEqual([
    'optimizacion-molinos',
    'mantenimiento-predictivo',
  ])
})

it('gets a published content item by slug', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Tecnología de evaporación',
          slug: 'tecnologia-evaporacion',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Tecnología',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['eficiencia'],
          status: 'published',
          source_name: 'Fuente 1',
          source_url: 'https://example.com/1',
          is_featured: true,
        },
      ],
    },
  })

  const { getPublishedContentBySlug } = await loadApiWithFake(supabase)

  const item = await getPublishedContentBySlug('tecnologia-evaporacion')

  expect(item.title).toBe('Tecnología de evaporación')
  expect(item.status).toBe('published')
})

it('lists published events ordered by start date ascending', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      events: [
        {
          id: 'event-1',
          title: 'Congreso Azucarero 2026',
          slug: 'congreso-azucarero-2026',
          summary: 'Evento anual',
          start_date: '2026-08-10',
          end_date: '2026-08-12',
          city: 'San Salvador',
          country: 'El Salvador',
          organizer: 'Asociación',
          source_url: 'https://example.com/event1',
          cover_image_url: null,
          tags: ['eventos'],
          status: 'published',
        },
        {
          id: 'event-2',
          title: 'Expo Caña',
          slug: 'expo-cana',
          summary: 'Expo regional',
          start_date: '2026-06-01',
          end_date: '2026-06-03',
          city: 'Cali',
          country: 'Colombia',
          organizer: 'Expo',
          source_url: 'https://example.com/event2',
          cover_image_url: null,
          tags: ['eventos'],
          status: 'published',
        },
        {
          id: 'event-3',
          title: 'Evento oculto',
          slug: 'evento-oculto',
          summary: 'No se publica',
          start_date: '2026-05-01',
          end_date: null,
          city: 'Lima',
          country: 'Perú',
          organizer: 'Privado',
          source_url: 'https://example.com/event3',
          cover_image_url: null,
          tags: ['eventos'],
          status: 'draft',
        },
      ],
    },
  })

  const { listPublishedEvents } = await loadApiWithFake(supabase)

  const items = await listPublishedEvents()

  expect(items.map((item) => item.slug)).toEqual([
    'expo-cana',
    'congreso-azucarero-2026',
  ])
})

it('lists published price items ordered by observed date descending', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      priceItems: [
        {
          id: 'price-1',
          label: 'Azúcar crudo',
          value: '23.10',
          unit: 'USD/lb',
          observed_at: '2026-04-14',
          source_name: 'ICE',
          source_url: 'https://example.com/price1',
          notes: 'Cierre diario',
          status: 'published',
        },
        {
          id: 'price-2',
          label: 'Etanol',
          value: '2.40',
          unit: 'USD/gal',
          observed_at: '2026-04-16',
          source_name: 'B3',
          source_url: 'https://example.com/price2',
          notes: 'Referencia semanal',
          status: 'published',
        },
        {
          id: 'price-3',
          label: 'Oculto',
          value: '1.00',
          unit: 'USD',
          observed_at: '2026-04-18',
          source_name: 'Interno',
          source_url: 'https://example.com/price3',
          notes: 'No publicar',
          status: 'draft',
        },
      ],
    },
  })

  const { listPublishedPrices } = await loadApiWithFake(supabase)

  const items = await listPublishedPrices()

  expect(items.map((item) => item.label)).toEqual(['Etanol', 'Azúcar crudo'])
})

it('lists featured published content only', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Visible destacada',
          slug: 'visible-destacada',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Mercado',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Fuente 1',
          source_url: 'https://example.com/1',
          is_featured: true,
        },
        {
          id: 'news-2',
          type: 'news',
          title: 'Borrador destacado',
          slug: 'borrador-destacado',
          summary: 'Resumen corto',
          body: 'Resumen amplio',
          category: 'Mercado',
          published_at: '2026-04-17T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'draft',
          source_name: 'Fuente 2',
          source_url: 'https://example.com/2',
          is_featured: true,
        },
      ],
    },
  })

  const { listFeaturedContent } = await loadApiWithFake(supabase)

  const items = await listFeaturedContent()

  expect(items.map((item) => item.slug)).toEqual(['visible-destacada'])
})

it('renders a content card with title, summary, source, date, tag and call to action', () => {
  render(
    <MemoryRouter>
      <ContentCard
        item={{
          id: 'news-1',
          type: 'news',
          title: 'Nueva referencia de mercado para azúcar',
          slug: 'nueva-referencia-mercado-azucar',
          summary: 'Resumen curado para técnicos y líderes de operación.',
          body: 'Contenido ampliado',
          category: 'Mercado',
          publishedAt: '2026-04-16T12:00:00.000Z',
          tags: ['azúcar', 'mercado'],
          status: 'published',
          sourceName: 'Reuters',
          sourceUrl: 'https://example.com/news',
          isFeatured: true,
        }}
      />
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: 'Nueva referencia de mercado para azúcar' })).toHaveAttribute(
    'href',
    '/informacion/nueva-referencia-mercado-azucar',
  )
  expect(screen.getByText('Resumen curado para técnicos y líderes de operación.')).toBeInTheDocument()
  expect(screen.getByText('Reuters')).toBeInTheDocument()
  expect(screen.getByText('azúcar')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver más' })).toHaveAttribute(
    'href',
    '/informacion/nueva-referencia-mercado-azucar',
  )
})

it('renders an event card with date, location, organizer and external source', () => {
  render(
    <EventCard
      item={{
        id: 'event-1',
        title: 'Congreso regional de cogeneración',
        slug: 'congreso-regional-cogeneracion',
        summary: 'Agenda para líderes técnicos y energéticos.',
        startDate: '2026-06-18',
        endDate: '2026-06-20',
        city: 'Cali',
        country: 'Colombia',
        organizer: 'Asociación Regional',
        sourceUrl: 'https://example.com/event',
        tags: ['eventos'],
        status: 'published',
      }}
    />,
  )

  expect(screen.getByText('Congreso regional de cogeneración')).toBeInTheDocument()
  expect(screen.getByText(/Cali/)).toBeInTheDocument()
  expect(screen.getByText('Asociación Regional')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver evento' })).toHaveAttribute(
    'href',
    'https://example.com/event',
  )
})

it('renders a price card with value, observed date, source and note', () => {
  render(
    <PriceCard
      item={{
        id: 'price-1',
        label: 'Azúcar crudo',
        value: '23.10',
        unit: 'USD/lb',
        observedAt: '2026-04-16',
        sourceName: 'ICE',
        sourceUrl: 'https://example.com/price',
        notes: 'Indicador semanal de referencia.',
        status: 'published',
      }}
    />,
  )

  expect(screen.getByText('Azúcar crudo')).toBeInTheDocument()
  expect(screen.getByText('23.10 USD/lb')).toBeInTheDocument()
  expect(screen.getByText('ICE')).toBeInTheDocument()
  expect(screen.getByText('Indicador semanal de referencia.')).toBeInTheDocument()
})

it('renders tag badge and section header helpers', () => {
  render(
    <>
      <SectionHeader
        eyebrow="Información"
        title="Noticias y análisis"
        description="Curación ligera para apoyar adquisición y recurrencia."
      />
      <TagBadge label="automatización" />
    </>,
  )

  expect(screen.getByText('Información')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Noticias y análisis' })).toBeInTheDocument()
  expect(screen.getByText('automatización')).toBeInTheDocument()
})

it('renders a section header with h1 when requested', () => {
  render(<SectionHeader title="Información" as="h1" />)

  expect(screen.getByRole('heading', { name: 'Información', level: 1 })).toBeInTheDocument()
})

it('renders featured content strip with cards', () => {
  render(
    <MemoryRouter>
      <FeaturedContent
        items={[
          {
            id: 'news-1',
            type: 'news',
            title: 'Pieza destacada',
            slug: 'pieza-destacada',
            summary: 'Resumen destacado.',
            body: 'Cuerpo',
            category: 'Innovación',
            publishedAt: '2026-04-16T12:00:00.000Z',
            tags: ['innovación'],
            status: 'published',
            sourceName: 'Zucarlink',
            isFeatured: true,
          },
        ]}
      />
    </MemoryRouter>,
  )

  expect(screen.getByRole('heading', { name: 'Destacados de la semana' })).toBeInTheDocument()
  expect(screen.getByText('Pieza destacada')).toBeInTheDocument()
})

it('updates content filters when the user types and changes category', async () => {
  const user = userEvent.setup()
  const handleQueryChange = vi.fn()
  const handleCategoryChange = vi.fn()

  function FiltersHarness() {
    const [query, setQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    return (
      <ContentFilters
        categories={['Mercado', 'Tecnología']}
        query={query}
        selectedCategory={selectedCategory}
        onQueryChange={(value) => {
          setQuery(value)
          handleQueryChange(value)
        }}
        onCategoryChange={(value) => {
          setSelectedCategory(value)
          handleCategoryChange(value)
        }}
      />
    )
  }

  render(<FiltersHarness />)

  await user.type(screen.getByLabelText('Buscar contenido'), 'azúcar')
  await user.selectOptions(screen.getByLabelText('Categoría'), 'Tecnología')

  expect(handleQueryChange).toHaveBeenCalledWith('azúcar')
  expect(handleCategoryChange).toHaveBeenCalledWith('Tecnología')
})

it('renders the information hub with featured content and links to each section', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Pieza destacada del hub',
          slug: 'pieza-destacada-hub',
          summary: 'Resumen para el hub.',
          body: 'Cuerpo de la pieza.',
          category: 'Mercado',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Reuters',
          source_url: 'https://example.com/news',
          is_featured: true,
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Información para seguirle el pulso al sector' })
  expect(screen.getByText('Pieza destacada del hub')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Noticias' })).toHaveAttribute(
    'href',
    '/informacion/noticias',
  )
  expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/informacion/blog')
  expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute(
    'href',
    '/informacion/eventos',
  )
  expect(screen.getByRole('link', { name: 'Precios' })).toHaveAttribute(
    'href',
    '/informacion/precios',
  )
})

it('renders only news items in the news page', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Noticia visible',
          slug: 'noticia-visible',
          summary: 'Resumen noticioso.',
          body: 'Cuerpo noticioso.',
          category: 'Mercado',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Reuters',
          source_url: 'https://example.com/news',
          is_featured: false,
        },
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Blog oculto en noticias',
          slug: 'blog-oculto-noticias',
          summary: 'Resumen blog.',
          body: 'Cuerpo blog.',
          category: 'Tecnología',
          published_at: '2026-04-15T12:00:00.000Z',
          tags: ['automatización'],
          status: 'published',
          source_name: 'Zucarlink',
          source_url: 'https://example.com/blog',
          is_featured: false,
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion/noticias',
    supabase,
  })

  expect(screen.getByText('Cargando noticias.')).toBeInTheDocument()
  await screen.findByRole('heading', { name: 'Noticias del sector' })
  expect(screen.getByText('Noticia visible')).toBeInTheDocument()
  expect(screen.queryByText('Blog oculto en noticias')).not.toBeInTheDocument()
})

it('renders only blog items in the blog page', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Noticia fuera de blog',
          slug: 'noticia-fuera-blog',
          summary: 'Resumen noticioso.',
          body: 'Cuerpo noticioso.',
          category: 'Mercado',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Reuters',
          source_url: 'https://example.com/news',
          is_featured: false,
        },
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Blog visible',
          slug: 'blog-visible',
          summary: 'Resumen blog.',
          body: 'Cuerpo blog.',
          category: 'Tecnología',
          published_at: '2026-04-15T12:00:00.000Z',
          tags: ['automatización'],
          status: 'published',
          source_name: 'Zucarlink',
          source_url: 'https://example.com/blog',
          is_featured: false,
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion/blog',
    supabase,
  })

  expect(screen.getByText('Cargando artículos.')).toBeInTheDocument()
  await screen.findByRole('heading', { name: 'Artículos y análisis' })
  expect(screen.getByText('Blog visible')).toBeInTheDocument()
  expect(screen.queryByText('Noticia fuera de blog')).not.toBeInTheDocument()
})

it('renders a public content detail page with source, body, tags and ctas', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Detalle técnico visible',
          slug: 'detalle-tecnico-visible',
          summary: 'Resumen visible.',
          body: 'Cuerpo técnico amplio para validar la página de detalle.',
          category: 'Tecnología',
          published_at: '2026-04-15T12:00:00.000Z',
          tags: ['automatización', 'eficiencia'],
          status: 'published',
          source_name: 'Zucarlink',
          source_url: 'https://example.com/blog',
          is_featured: false,
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion/detalle-tecnico-visible',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Detalle técnico visible' })
  expect(screen.getByText('Resumen visible.')).toBeInTheDocument()
  expect(screen.getByText('Cuerpo técnico amplio para validar la página de detalle.')).toBeInTheDocument()
  expect(screen.getByText('automatización')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Fuente original' })).toHaveAttribute(
    'href',
    'https://example.com/blog',
  )
  expect(screen.getByRole('link', { name: 'Únete a Zucarlink' })).toHaveAttribute(
    'href',
    '/register',
  )
  expect(screen.getByRole('link', { name: 'Participa en el foro' })).toHaveAttribute(
    'href',
    '/forum',
  )
})

it('renders events page with upcoming and past sections', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      events: [
        {
          id: 'event-1',
          title: 'Evento pasado',
          slug: 'evento-pasado',
          summary: 'Resumen pasado.',
          start_date: '2026-01-10',
          end_date: '2026-01-12',
          city: 'Lima',
          country: 'Perú',
          organizer: 'Red 1',
          source_url: 'https://example.com/past',
          cover_image_url: null,
          tags: ['eventos'],
          status: 'published',
        },
        {
          id: 'event-2',
          title: 'Evento próximo',
          slug: 'evento-proximo',
          summary: 'Resumen futuro.',
          start_date: '2026-12-10',
          end_date: '2026-12-12',
          city: 'Cali',
          country: 'Colombia',
          organizer: 'Red 2',
          source_url: 'https://example.com/future',
          cover_image_url: null,
          tags: ['eventos'],
          status: 'published',
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion/eventos',
    supabase,
  })

  expect(screen.getByText('Cargando eventos.')).toBeInTheDocument()
  await screen.findByRole('heading', { name: 'Congresos y eventos' })
  expect(screen.getByRole('heading', { name: 'Próximos' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Pasados' })).toBeInTheDocument()
  expect(screen.getByText('Evento próximo')).toBeInTheDocument()
  expect(screen.getByText('Evento pasado')).toBeInTheDocument()
})

it('renders prices page with a note about curated indicators', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      priceItems: [
        {
          id: 'price-1',
          label: 'Azúcar crudo',
          value: '23.10',
          unit: 'USD/lb',
          observed_at: '2026-04-16',
          source_name: 'ICE',
          source_url: 'https://example.com/price',
          notes: 'Indicador semanal.',
          status: 'published',
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion/precios',
    supabase,
  })

  expect(screen.getByText('Cargando indicadores.')).toBeInTheDocument()
  await screen.findByRole('heading', { name: 'Precios e indicadores' })
  expect(screen.getByText('Azúcar crudo')).toBeInTheDocument()
  expect(screen.getByText(/no es un feed en tiempo real/i)).toBeInTheDocument()
})

it('renders an information preview on the home page', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Preview de información',
          slug: 'preview-informacion',
          summary: 'Resumen para home.',
          body: 'Cuerpo para home.',
          category: 'Mercado',
          published_at: '2026-04-16T12:00:00.000Z',
          tags: ['azúcar'],
          status: 'published',
          source_name: 'Reuters',
          source_url: 'https://example.com/news',
          is_featured: true,
        },
      ],
    },
    rpc: {
      list_forum_threads: {
        data: [],
      },
    },
  })

  await renderApp({
    initialRoute: '/',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Información útil para volver al sitio' })
  expect(screen.getByText('Preview de información')).toBeInTheDocument()
  const informationLinks = screen.getAllByRole('link', { name: 'Ver información' })
  expect(informationLinks[informationLinks.length - 1]).toHaveAttribute(
    'href',
    '/informacion',
  )
})

it('shows the information module in the public navigation', async () => {
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/informacion',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Información para seguirle el pulso al sector' })
  expect(screen.getByRole('link', { name: 'Información' })).toHaveAttribute(
    'href',
    '/informacion',
  )
})

it('sets basic metadata for the information hub page', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [],
    },
  })

  await renderApp({
    initialRoute: '/informacion',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Información para seguirle el pulso al sector' })
  expect(document.title).toContain('Información')
  expect(
    document.querySelector('meta[name="description"]')?.getAttribute('content')?.toLowerCase(),
  ).toContain('noticias, análisis, eventos e indicadores')
})

it('sets basic metadata for a content detail page', async () => {
  const supabase = createSupabaseAuthFake({
    data: {
      contentItems: [
        {
          id: 'blog-1',
          type: 'blog',
          title: 'Detalle con metadata',
          slug: 'detalle-con-metadata',
          summary: 'Resumen para metadata.',
          body: 'Cuerpo para metadata.',
          category: 'Tecnología',
          published_at: '2026-04-15T12:00:00.000Z',
          tags: ['automatización'],
          status: 'published',
          source_name: 'Zucarlink',
          source_url: 'https://example.com/blog',
          is_featured: false,
        },
      ],
    },
  })

  await renderApp({
    initialRoute: '/informacion/detalle-con-metadata',
    supabase,
  })

  await screen.findByRole('heading', { name: 'Detalle con metadata' })
  expect(document.title).toContain('Detalle con metadata')
  expect(
    document.querySelector('meta[name="description"]')?.getAttribute('content'),
  ).toContain('Resumen para metadata.')
})
