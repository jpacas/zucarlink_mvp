import type { Session, User } from '@supabase/supabase-js'

export type AccountType = 'technician' | 'provider'

export interface AuthUserMetadata {
  account_type?: AccountType
  full_name?: string
}

export interface AuthState {
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  errorMessage: string | null
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload extends SignInPayload {
  accountType: AccountType
  fullName: string
}
