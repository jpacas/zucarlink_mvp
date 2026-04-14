const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

type RequiredKey = (typeof requiredKeys)[number]

export function getMissingEnvKeys(): RequiredKey[] {
  return requiredKeys.filter((key) => {
    const value = import.meta.env[key]
    return typeof value !== 'string' || value.trim().length === 0
  })
}

export function hasSupabaseEnv() {
  return getMissingEnvKeys().length === 0
}
