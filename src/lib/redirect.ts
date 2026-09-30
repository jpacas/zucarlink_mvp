// Valida un parámetro `next` usado para volver al usuario a donde estaba antes
// de iniciar sesión o registrarse (ej. un hilo del foro). Nunca confiar en el
// valor crudo: debe ser una ruta relativa del propio sitio y pertenecer a un
// conjunto de rutas conocidas, o se descarta.

const ALLOWED_EXACT_PATHS = new Set(['/'])

const ALLOWED_PATH_PREFIXES = [
  '/directory',
  '/forum',
  '/informacion',
  '/proveedores',
  '/app',
  '/onboarding',
  '/contacto',
]

// Rutas de entrada de auth: nunca son un destino válido de retorno (evita loops).
const BLOCKED_PATHS = new Set(['/login', '/register'])

function looksLikeExternalOrProtocolRelative(value: string): boolean {
  if (!value.startsWith('/')) return true
  if (value.startsWith('//')) return true
  if (value.includes('\\')) return true
  if (value.includes('://')) return true
  // Cualquier esquema (javascript:, data:, etc.) antes del primer slash.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return true
  return false
}

export function sanitizeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (raw.length > 2048) return null
  if (looksLikeExternalOrProtocolRelative(raw)) return null

  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }

  if (looksLikeExternalOrProtocolRelative(decoded)) return null

  const pathname = decoded.split('?')[0].split('#')[0]

  if (BLOCKED_PATHS.has(pathname)) return null

  const isAllowed =
    ALLOWED_EXACT_PATHS.has(pathname) ||
    ALLOWED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!isAllowed) return null

  return raw
}
