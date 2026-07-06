// Verificación de secretos compartidos (bearer) en tiempo constante.
// Comparar con `===`/`!==` filtra el secreto byte a byte por diferencias de
// tiempo. Usamos el patrón "double HMAC": se firma cada cadena con una clave
// aleatoria efímera y se comparan digests de longitud fija, ocultando tanto la
// longitud como el contenido del secreto. Sin dependencias externas (Web Crypto).

async function timingSafeEqualStr(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = crypto.getRandomValues(new Uint8Array(32))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign('HMAC', cryptoKey, enc.encode(a)),
    crypto.subtle.sign('HMAC', cryptoKey, enc.encode(b)),
  ])
  const va = new Uint8Array(ha)
  const vb = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < va.length; i++) {
    diff |= va[i] ^ vb[i]
  }
  return diff === 0
}

// Devuelve true solo si el header Authorization coincide con `Bearer <secret>`.
// Falla cerrado si el secreto no está configurado.
export async function verifyBearerSecret(req: Request, secret: string): Promise<boolean> {
  if (!secret) {
    return false
  }
  const authHeader = req.headers.get('Authorization') ?? ''
  return await timingSafeEqualStr(authHeader, `Bearer ${secret}`)
}
