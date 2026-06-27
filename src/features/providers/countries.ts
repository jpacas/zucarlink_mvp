// Lista fija de países para el selector estructurado de cobertura de proveedores.
// Centroamérica primero (mercado principal de Zucarlink) y luego el resto de
// Latinoamérica + socios habituales. Se mantiene ordenada alfabéticamente para el
// render directo en <select> y en los chips del formulario.
export const PROVIDER_COUNTRIES = [
  'Argentina',
  'Belice',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
] as const

export type ProviderCountry = (typeof PROVIDER_COUNTRIES)[number]
