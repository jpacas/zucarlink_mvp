import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { getCurrentProviderProfile } from './api'
import type { CurrentProviderProfile } from './types'

export function useCurrentProviderProfile(user: User | null) {
  const [provider, setProvider] = useState<CurrentProviderProfile | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) {
      setProvider(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      setProvider(await getCurrentProviderProfile(user))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible cargar el perfil comercial.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    provider,
    isLoading,
    errorMessage,
    reload,
  }
}
