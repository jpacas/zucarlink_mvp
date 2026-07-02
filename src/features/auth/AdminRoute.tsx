import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from './AuthProvider'
import { isAdminUser } from './roles'

export function AdminRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <section className="content-card stack content-card--status">
        <h2>Abriendo tu cuenta</h2>
        <p className="helper-text">Estamos validando tu sesión.</p>
      </section>
    )
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
