import { describe, expect, it } from 'vitest'

import { sanitizeNextPath } from './redirect'

describe('sanitizeNextPath', () => {
  it('acepta rutas conocidas del sitio', () => {
    expect(sanitizeNextPath('/forum/thread/mi-tema')).toBe('/forum/thread/mi-tema')
    expect(sanitizeNextPath('/directory')).toBe('/directory')
    expect(sanitizeNextPath('/app/directory')).toBe('/app/directory')
    expect(sanitizeNextPath('/')).toBe('/')
    expect(sanitizeNextPath('/proveedores/directorio')).toBe('/proveedores/directorio')
  })

  it('preserva query string y hash de una ruta permitida', () => {
    expect(sanitizeNextPath('/forum/thread/mi-tema?highlight=42')).toBe(
      '/forum/thread/mi-tema?highlight=42',
    )
  })

  it('rechaza URLs externas', () => {
    expect(sanitizeNextPath('https://evil.com')).toBeNull()
    expect(sanitizeNextPath('http://evil.com/directory')).toBeNull()
  })

  it('rechaza URLs protocol-relative', () => {
    expect(sanitizeNextPath('//evil.com')).toBeNull()
    expect(sanitizeNextPath('//evil.com/forum')).toBeNull()
  })

  it('rechaza backslashes usados para simular protocol-relative', () => {
    expect(sanitizeNextPath('/\\evil.com')).toBeNull()
    expect(sanitizeNextPath('\\\\evil.com')).toBeNull()
  })

  it('rechaza esquemas no http', () => {
    expect(sanitizeNextPath('javascript:alert(1)')).toBeNull()
    expect(sanitizeNextPath('data:text/html,evil')).toBeNull()
  })

  it('rechaza rutas de auth (evita loops)', () => {
    expect(sanitizeNextPath('/login')).toBeNull()
    expect(sanitizeNextPath('/register')).toBeNull()
  })

  it('rechaza rutas no permitidas fuera del allowlist', () => {
    expect(sanitizeNextPath('/admin/secret')).toBeNull()
    expect(sanitizeNextPath('/algo-random')).toBeNull()
  })

  it('rechaza valores nulos, vacíos o no relativos', () => {
    expect(sanitizeNextPath(null)).toBeNull()
    expect(sanitizeNextPath(undefined)).toBeNull()
    expect(sanitizeNextPath('')).toBeNull()
    expect(sanitizeNextPath('evil.com')).toBeNull()
  })

  it('rechaza payloads con encoding que esconden una URL externa', () => {
    expect(sanitizeNextPath('/%2F%2Fevil.com')).toBeNull()
    expect(sanitizeNextPath('%2F%2Fevil.com')).toBeNull()
  })

  it('rechaza strings excesivamente largos', () => {
    expect(sanitizeNextPath(`/forum/${'a'.repeat(3000)}`)).toBeNull()
  })
})
