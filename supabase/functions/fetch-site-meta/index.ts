// Edge Function: lee metadatos públicos del sitio web de un proveedor (<title>, meta
// description y Open Graph) para prellenar el onboarding. SIN IA y SIN credenciales:
// solo descarga HTML público. verify_jwt queda activo (lo invoca un proveedor autenticado).
import { corsHeaders } from '../_shared/cors.ts'

const FETCH_TIMEOUT_MS = 5000
const MAX_BYTES = 512 * 1024 // 512 KB de HTML es más que suficiente para el <head>

interface SiteMeta {
  title: string
  description: string
  image: string
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Guard anti-SSRF: solo http/https hacia hosts públicos. Bloquea localhost y rangos
// privados/link-local para que la función no se use como proxy hacia la red interna.
function isSafePublicUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null
  }

  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    host.includes(':') // direcciones IPv6 literales (incluye ::1)
  ) {
    return null
  }

  return url
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function matchMeta(html: string, attr: 'name' | 'property', key: string): string {
  // Tolera el orden de atributos: <meta name=".." content=".."> o al revés.
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`,
      'i',
    ),
  ]
  for (const pattern of patterns) {
    const found = html.match(pattern)
    if (found?.[1]) {
      return decodeEntities(found[1])
    }
  }
  return ''
}

function parseMeta(html: string): SiteMeta {
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ''
  const ogTitle = matchMeta(html, 'property', 'og:title')
  const metaDescription = matchMeta(html, 'name', 'description')
  const ogDescription = matchMeta(html, 'property', 'og:description')
  const ogImage = matchMeta(html, 'property', 'og:image')

  return {
    title: (ogTitle || decodeEntities(titleTag)).slice(0, 200),
    description: (ogDescription || metaDescription).slice(0, 600),
    image: ogImage.slice(0, 500),
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  let body: { url?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido.' }, 400)
  }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
  if (!rawUrl) {
    return jsonResponse({ error: 'Falta la URL del sitio.' }, 400)
  }

  const safeUrl = isSafePublicUrl(rawUrl)
  if (!safeUrl) {
    return jsonResponse(
      { error: 'URL no válida. Usa una dirección pública con http:// o https://.' },
      400,
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(safeUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // UA explícito: algunos sitios devuelven 403 a clientes sin User-Agent.
        'User-Agent': 'ZucarlinkBot/1.0 (+https://zucarlink.com)',
        Accept: 'text/html',
      },
    })

    if (!response.ok) {
      return jsonResponse(
        { error: `El sitio respondió ${response.status}. Verifica la URL.` },
        502,
      )
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return jsonResponse(
        { error: 'La URL no devuelve una página HTML.' },
        422,
      )
    }

    // Leemos solo los primeros MAX_BYTES; el <head> con los metadatos va al inicio.
    const reader = response.body?.getReader()
    if (!reader) {
      return jsonResponse({ error: 'No fue posible leer el sitio.' }, 502)
    }

    const decoder = new TextDecoder()
    let html = ''
    let received = 0
    while (received < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      html += decoder.decode(value, { stream: true })
      if (/<\/head>/i.test(html)) break // ya tenemos el head completo
    }
    await reader.cancel().catch(() => undefined)

    return jsonResponse(parseMeta(html))
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    return jsonResponse(
      { error: aborted ? 'El sitio tardó demasiado en responder.' : 'No fue posible leer el sitio.' },
      502,
    )
  } finally {
    clearTimeout(timeout)
  }
})
