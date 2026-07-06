import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { getProviderStatusMeta } from '../features/providers/status'
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
        <p className="helper-text">Cargando perfil de proveedor…</p>
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

  const statusMeta = getProviderStatusMeta(provider.status)

  return (
    <div className="stack">
    <Breadcrumbs items={[
      { label: 'Panel', to: '/app' },
      { label: 'Perfil comercial' },
    ]} />
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Proveedor</p>
          <h2>{provider.companyName}</h2>
          <div className="actions">
            {provider.category ? <span className="user-badge">{provider.category.name}</span> : null}
            <span className={`user-badge ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
          </div>
        </div>
        <div className="actions">
          <Link className="button button--secondary" to="/app/provider/leads">
            Ver solicitudes
          </Link>
          <Link className="button button--secondary" to="/app/provider/edit">
            Editar perfil
          </Link>
        </div>
      </div>

      {!statusMeta.isPublic ? (
        <div className="info-card stack stack--compact" role="status">
          <h3>{statusMeta.label}</h3>
          <p className="helper-text">{statusMeta.description}</p>
        </div>
      ) : null}

      <div className="info-card stack">
        <h3>Descripción</h3>
        <p>{provider.description || 'Agrega una descripción para explicar tu propuesta.'}</p>
      </div>

      <div className="info-card stack">
        <h3>Marcas que ofrece</h3>
        <p>{provider.brands || 'Agrega las marcas que fabricas o representas.'}</p>
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
    </div>
  )
}
