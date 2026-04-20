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
    return (
      <section className="content-card stack content-card--status">
        <h2>Preparando acceso</h2>
        <p className="helper-text">Estamos revisando tu sesión.</p>
      </section>
    )
  }

  if (user) {
    if (!destination) {
      return (
        <section className="content-card stack content-card--status">
          <h2>Redirigiendo</h2>
          <p className="helper-text">Te llevamos a tu siguiente paso dentro de Zucarlink.</p>
        </section>
      )
    }

    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
