import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from './AuthProvider'
import { resolvePostAuthDestination } from '../profile/api'

export function PublicOnlyRoute() {
  const { isLoading, user } = useAuth()
  const [destination, setDestination] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setDestination(null)
      return
    }

    void resolvePostAuthDestination(user)
      .then((nextDestination) => {
        if (!cancelled) {
          setDestination(nextDestination)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDestination('/onboarding')
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (isLoading) {
    return <p className="helper-text">Cargando sesión...</p>
  }

  if (user) {
    if (!destination) {
      return <p className="helper-text">Redirigiendo...</p>
    }

    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
