import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { getProviderStatusMeta } from '../features/providers/status'
import { useCurrentProviderProfile } from '../features/providers/useCurrentProviderProfile'

// Los campos marcas/países/servicios se guardan como texto separado por comas.
// Los mostramos como chips para igualar la ficha comercial pública.
function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

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
          <div className="badge-row">
            {provider.category ? (
              <span className="user-badge user-badge--proveedor">{provider.category.name}</span>
            ) : null}
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
        {splitList(provider.brands).length > 0 ? (
          <div className="chip-grid">
            {splitList(provider.brands).map((brand) => (
              <span key={brand} className="chip chip--info">
                {brand}
              </span>
            ))}
          </div>
        ) : (
          <p className="helper-text">Agrega las marcas que fabricas o representas.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Cobertura</h3>
        {splitList(provider.countries).length > 0 ? (
          <div className="chip-grid">
            {splitList(provider.countries).map((country) => (
              <span key={country} className="chip chip--proveedor">
                {country}
              </span>
            ))}
          </div>
        ) : (
          <p className="helper-text">Define países donde operas.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Productos y servicios</h3>
        {splitList(provider.productsServices).length > 0 ? (
          <div className="chip-grid">
            {splitList(provider.productsServices).map((item) => (
              <span key={item} className="chip chip--proveedor">
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="helper-text">Detalla tus soluciones principales.</p>
        )}
      </div>
    </section>
    </div>
  )
}
