import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { getCurrentProfile } from './api'
import type { CurrentProfile } from './types'

export function useCurrentProfile(user: User | null) {
  const [profile, setProfile] = useState<CurrentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextProfile = await getCurrentProfile(user)
      setProfile(nextProfile)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible cargar el perfil.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      setErrorMessage(null)
      return
    }

    setIsLoading(true)
    void reload()
  }, [reload, user])

  return {
    profile,
    isLoading,
    errorMessage,
    reload,
  }
}
