import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { useCurrentProviderProfile } from '../features/providers/useCurrentProviderProfile'

export function AppProviderPage() {
  const { user } = useAuth()
  const { provider, isLoading, errorMessage } = useCurrentProviderProfile(user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Perfil comercial</h2>
        <p className="helper-text">Cargando perfil de proveedor.</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="content-card stack">
        <h2>Perfil comercial</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    )
  }

  if (!provider) {
    return (
      <section className="content-card stack">
        <h2>Perfil comercial</h2>
        <p className="helper-text">Completa tu activación para aparecer en el directorio.</p>
        <div className="actions">
          <Link className="button" to="/onboarding">
            Activar perfil
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Proveedor</p>
          <h2>{provider.companyName}</h2>
          <div className="actions">
            {provider.category ? <span className="user-badge">{provider.category.name}</span> : null}
            <span className="user-badge">{provider.status}</span>
            {provider.isVerified ? <span className="user-badge">Verificado</span> : null}
          </div>
        </div>
        <Link className="button button--secondary" to="/app/provider/edit">
          Editar perfil
        </Link>
      </div>

      <div className="info-card stack">
        <h3>Resumen comercial</h3>
        <p>{provider.shortDescription || 'Agrega una descripción corta para explicar tu propuesta.'}</p>
      </div>

      <div className="info-card stack">
        <h3>Cobertura</h3>
        <p>{provider.countries || 'Define países donde operas.'}</p>
      </div>

      <div className="info-card stack">
        <h3>Productos y servicios</h3>
        <p>{provider.productsServices || 'Detalla tus soluciones principales.'}</p>
      </div>
    </section>
  )
}
