import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { hasSupabaseEnv } from './env'
import type { Database } from './database.types'

let browserClient: SupabaseClient<Database> | null = null

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null
  }

  if (browserClient) {
    return browserClient
  }

  browserClient = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )

  return browserClient
}

export function getSupabaseClientOrThrow() {
  const client = getSupabaseBrowserClient()

  if (!client) {
    throw new Error('Supabase no está configurado.')
  }

  return client
}
