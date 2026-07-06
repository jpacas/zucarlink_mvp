// Cabeceras CORS compartidas para Edge Functions invocadas desde el navegador
// (supabase.functions.invoke). El preflight OPTIONS debe responderse con estas cabeceras.
//
// En vez de un wildcard '*', se refleja el Origin solo si está en la allowlist de
// dominios de Zucarlink. Así la función no puede usarse como proxy de lectura desde
// cualquier sitio de terceros en el navegador.

const ALLOWED_ORIGINS = new Set<string>([
  'https://www.zucarlink.com',
  'https://zucarlink.com',
  'http://localhost:5173', // Vite dev
])

const BASE_HEADERS = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
} as const

// Resuelve las cabeceras CORS para una petición concreta. Si el Origin no está
// permitido, se devuelve el dominio primario (el navegador bloqueará la respuesta).
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.zucarlink.com'
  return { ...BASE_HEADERS, 'Access-Control-Allow-Origin': allowOrigin }
}
