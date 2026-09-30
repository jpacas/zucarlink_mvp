// Edge Function: sirve un HTML mínimo con meta tags OG/Twitter reales para
// perfiles técnicos y hilos de foro. Los crawlers de redes sociales
// (facebookexternalhit, Twitterbot, LinkedInBot, WhatsApp, etc.) no ejecutan
// JS — leen el HTML tal como llega. `usePageMetadata.ts` setea estos tags
// desde React después del render, así que un link compartido siempre mostraba
// la card genérica del sitio (index.html) en vez de la del perfil/hilo real.
//
// Vercel rutea acá SOLO requests de crawlers conocidos (ver regla `has` en
// vercel.json, mismo patrón que el rewrite de /sitemap.xml) — un usuario real
// nunca debería llegar a esta función, pero por si el filtro de user-agent
// da un falso positivo, la respuesta igual redirige (meta refresh + script)
// a la ruta real donde carga la SPA normal.
//
// Desplegar SIN verificación de JWT porque la consumen los crawlers:
//   supabase functions deploy social-preview --no-verify-jwt
import { getAdminClient } from '../_shared/supabase-admin.ts'

const SITE_URL = 'https://www.zucarlink.com'
const SUPABASE_URL = 'https://iubakkrqnbguagultudw.supabase.co'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

interface PreviewData {
  title: string
  description: string
  path: string
  image: string
  type: 'profile' | 'article'
}

function renderHtml(data: PreviewData): string {
  const canonicalUrl = `${SITE_URL}${data.path}`
  const fullTitle = `${data.title} | Zucarlink`

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(data.description)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:type" content="${data.type === 'profile' ? 'profile' : 'article'}" />
<meta property="og:site_name" content="Zucarlink" />
<meta property="og:title" content="${escapeHtml(fullTitle)}" />
<meta property="og:description" content="${escapeHtml(data.description)}" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
<meta property="og:image" content="${escapeHtml(data.image)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
<meta name="twitter:description" content="${escapeHtml(data.description)}" />
<meta name="twitter:image" content="${escapeHtml(data.image)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
<script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</head>
<body>
<p><a href="${escapeHtml(canonicalUrl)}">${escapeHtml(fullTitle)}</a></p>
</body>
</html>`
}

function fallbackHtml(path: string): string {
  return renderHtml({
    title: 'Zucarlink — Red profesional de la industria azucarera',
    description:
      'Directorio curado, foro técnico y contacto directo con proveedores para técnicos y especialistas del sector azucarero.',
    path,
    image: DEFAULT_IMAGE,
    type: 'article',
  })
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const client = getAdminClient()

  try {
    if (type === 'profile') {
      const id = url.searchParams.get('id') ?? ''
      const { data } = await client.rpc('get_public_member_profile', { profile_id: id })
      const row = Array.isArray(data) ? data[0] : data

      if (!row) {
        return htmlResponse(fallbackHtml(`/directory/${id}`))
      }

      const roleLine = [row.role_title, row.organization_name].filter(Boolean).join(' · ')
      const description = [roleLine, row.short_bio].filter(Boolean).join(' — ') ||
        `Perfil técnico en la red de Zucarlink.`

      return htmlResponse(
        renderHtml({
          title: row.full_name,
          description: description.slice(0, 200),
          path: `/directory/${id}`,
          image: avatarUrl(row.avatar_path) ?? DEFAULT_IMAGE,
          type: 'profile',
        }),
      )
    }

    if (type === 'thread') {
      const slug = url.searchParams.get('slug') ?? ''
      const { data } = await client.rpc('get_forum_thread', { thread_slug: slug })
      const row = Array.isArray(data) ? data[0] : data

      if (!row) {
        return htmlResponse(fallbackHtml(`/forum/thread/${slug}`))
      }

      const authorName = row.author?.full_name ? `${row.author.full_name} · ` : ''

      return htmlResponse(
        renderHtml({
          title: row.title,
          description: `${authorName}${row.excerpt ?? ''}`.slice(0, 200),
          path: `/forum/thread/${slug}`,
          image: avatarUrl(row.author?.avatar_path) ?? DEFAULT_IMAGE,
          type: 'article',
        }),
      )
    }

    return htmlResponse(fallbackHtml('/'))
  } catch (error) {
    console.error('social-preview: fallo generando preview', error)
    return htmlResponse(fallbackHtml('/'))
  }
})

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
    },
  })
}
