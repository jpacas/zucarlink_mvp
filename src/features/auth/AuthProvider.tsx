import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { getMissingEnvKeys } from '../../lib/env'
import { getSupabaseBrowserClient } from '../../lib/supabase'
import type { SignInPayload, SignUpPayload } from '../../types/auth'

interface AuthContextValue {
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  errorMessage: string | null
  clearError: () => void
  signIn: (
    payload: SignInPayload,
  ) => Promise<{ needsEmailConfirmation: false; user: User }>
  signUp: (
    payload: SignUpPayload,
  ) => Promise<{ needsEmailConfirmation: boolean; user: User | null }>
  signOut: () => Promise<void>
}

const missingEnvKeys = getMissingEnvKeys()
const configurationError =
  missingEnvKeys.length > 0
    ? `Faltan variables de entorno: ${missingEnvKeys.join(', ')}.`
    : null

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    configurationError,
  )

  useEffect(() => {
    const client = getSupabaseBrowserClient()

    if (!client) {
      setIsLoading(false)
      return
    }

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrorMessage(error.message)
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setIsLoading(false)
      setErrorMessage(null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: !configurationError,
      isLoading,
      session,
      user,
      errorMessage,
      clearError: () => setErrorMessage(null),
      signIn: async ({ email, password }) => {
        const client = getSupabaseBrowserClient()

        if (!client) {
          throw new Error(configurationError ?? 'Supabase no está configurado.')
        }

        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setErrorMessage(error.message)
          throw error
        }

        setErrorMessage(null)
        const nextUser = client.auth.getUser
        const {
          data: { user: authenticatedUser },
        } = await nextUser()

        if (!authenticatedUser) {
          throw new Error('No fue posible recuperar el usuario autenticado.')
        }

        return {
          needsEmailConfirmation: false as const,
          user: authenticatedUser,
        }
      },
      signUp: async ({ accountType, fullName, email, password }) => {
        const client = getSupabaseBrowserClient()

        if (!client) {
          throw new Error(configurationError ?? 'Supabase no está configurado.')
        }

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_type: accountType,
              full_name: fullName,
            },
          },
        })

        if (error) {
          setErrorMessage(error.message)
          throw error
        }

        setErrorMessage(null)

        return {
          needsEmailConfirmation: !data.session,
          user: data.user,
        }
      },
      signOut: async () => {
        const client = getSupabaseBrowserClient()

        if (!client) {
          throw new Error(configurationError ?? 'Supabase no está configurado.')
        }

        const { error } = await client.auth.signOut()

        if (error) {
          setErrorMessage(error.message)
          throw error
        }

        setErrorMessage(null)
      },
    }),
    [errorMessage, isLoading, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
