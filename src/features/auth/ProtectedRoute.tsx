import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './AuthProvider'

export function ProtectedRoute() {
  const { isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <section className="content-card stack content-card--status">
        <h2>Abriendo tu cuenta</h2>
        <p className="helper-text">Estamos validando tu sesión.</p>
      </section>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
