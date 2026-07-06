// Edge Function: genera el sitemap.xml dinámico del sitio. Combina las rutas públicas
// fijas con los slugs publicados en la base (contenido editorial, proveedores activos y
// temas del foro). Vercel proxya /sitemap.xml hacia esta función (rewrite en vercel.json).
// Desplegar SIN verificación de JWT porque la consumen los crawlers:
//   supabase functions deploy sitemap --no-verify-jwt
import { getAdminClient } from '../_shared/supabase-admin.ts'

const SITE_URL = 'https://www.zucarlink.com'

const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/directory', changefreq: 'weekly', priority: '0.8' },
  { path: '/forum', changefreq: 'daily', priority: '0.8' },
  { path: '/informacion', changefreq: 'daily', priority: '0.7' },
  { path: '/informacion/noticias', changefreq: 'daily', priority: '0.6' },
  { path: '/informacion/blog', changefreq: 'weekly', priority: '0.6' },
  { path: '/informacion/eventos', changefreq: 'weekly', priority: '0.6' },
  { path: '/informacion/precios', changefreq: 'daily', priority: '0.6' },
  { path: '/proveedores', changefreq: 'weekly', priority: '0.8' },
  { path: '/proveedores/directorio', changefreq: 'weekly', priority: '0.8' },
  { path: '/contacto', changefreq: 'monthly', priority: '0.4' },
  { path: '/aviso-legal', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacidad', changefreq: 'yearly', priority: '0.2' },
  { path: '/terminos', changefreq: 'yearly', priority: '0.2' },
]

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function toLastmod(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10)
}

function renderUrl(entry: SitemapEntry): string {
  const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`]
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`)
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`)
  if (entry.priority) parts.push(`    <priority>${entry.priority}</priority>`)
  return `  <url>\n${parts.join('\n')}\n  </url>`
}

Deno.serve(async () => {
  const entries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    loc: `${SITE_URL}${route.path}`,
    changefreq: route.changefreq,
    priority: route.priority,
  }))

  // Las consultas dinámicas son "best effort": si alguna falla, el sitemap
  // sigue sirviendo las rutas fijas en lugar de responder un error.
  try {
    const client = getAdminClient()

    const [contentResult, providersResult, topicsResult] = await Promise.all([
      client
        .from('content_items')
        .select('slug, updated_at')
        .eq('status', 'published')
        .not('slug', 'is', null),
      client
        .from('providers')
        .select('slug, updated_at')
        .eq('status', 'active')
        .not('slug', 'is', null),
      client.from('forum_topics').select('slug, updated_at').not('slug', 'is', null),
    ])

    for (const row of contentResult.data ?? []) {
      entries.push({
        loc: `${SITE_URL}/informacion/${row.slug}`,
        lastmod: toLastmod(row.updated_at),
        changefreq: 'monthly',
        priority: '0.6',
      })
    }

    for (const row of providersResult.data ?? []) {
      entries.push({
        loc: `${SITE_URL}/proveedores/${row.slug}`,
        lastmod: toLastmod(row.updated_at),
        changefreq: 'weekly',
        priority: '0.7',
      })
    }

    for (const row of topicsResult.data ?? []) {
      entries.push({
        loc: `${SITE_URL}/forum/thread/${row.slug}`,
        lastmod: toLastmod(row.updated_at),
        changefreq: 'weekly',
        priority: '0.5',
      })
    }
  } catch (error) {
    console.error('sitemap: fallo consultando rutas dinámicas', error)
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(renderUrl),
    '</urlset>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache en el edge de Vercel: 1 h fresco + 24 h stale-while-revalidate.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
})
