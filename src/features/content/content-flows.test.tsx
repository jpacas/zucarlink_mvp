import { expect, it, vi } from 'vitest'

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
