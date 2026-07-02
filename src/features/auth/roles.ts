import type { User } from '@supabase/supabase-js'

export function isAdminUser(user: User | null | undefined): boolean {
  return Boolean(user?.app_metadata?.is_admin)
}
