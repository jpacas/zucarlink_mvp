const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

type RequiredKey = (typeof requiredKeys)[number]

// Acceso estático por variable: permite a Vite reemplazar cada `import.meta.env.X`
// en compilación e inyectar SOLO estas claves. Un acceso dinámico `import.meta.env[key]`
// obliga a Vite a incrustar el objeto de entorno completo (todas las VITE_*) en el bundle.
const requiredValues: Record<RequiredKey, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

export function getMissingEnvKeys(): RequiredKey[] {
  return requiredKeys.filter((key) => {
    const value = requiredValues[key]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

export function hasSupabaseEnv() {
  return getMissingEnvKeys().length === 0
}
