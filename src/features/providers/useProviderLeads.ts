import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { listProviderLeads } from './api'
import type { ProviderLead } from './types'

export function useProviderLeads(user: User | null) {
  const [leads, setLeads] = useState<ProviderLead[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) {
      setLeads([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      setLeads(await listProviderLeads())
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible cargar las solicitudes.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    leads,
    setLeads,
    isLoading,
    errorMessage,
    reload,
  }
}
