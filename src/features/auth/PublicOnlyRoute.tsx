import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from './AuthProvider'

export function PublicOnlyRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <p className="helper-text">Cargando sesión...</p>
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
