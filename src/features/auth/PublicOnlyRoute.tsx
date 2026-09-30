import { useEffect, useState } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'

import { useAuth } from './AuthProvider'
import { resolvePostAuthDestination } from '../profile/api'
import { sanitizeNextPath } from '../../lib/redirect'

export function PublicOnlyRoute() {
  const { isLoading, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [destination, setDestination] = useState<string | null>(null)
  // Cubre el regreso desde el link de confirmación de email: Supabase
  // establece la sesión al cargar /register?next=..., y como el usuario ya
  // está autenticado este guard es el que decide a dónde mandarlo (T4b).
  const queryNextPath = sanitizeNextPath(searchParams.get('next'))

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setDestination(null)
      return
    }

    if (queryNextPath) {
      setDestination(queryNextPath)
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
  }, [user, queryNextPath])

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
