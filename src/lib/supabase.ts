import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { hasSupabaseEnv } from './env'

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null
  }

  if (browserClient) {
    return browserClient
  }

  browserClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )

  return browserClient
}
