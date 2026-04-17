import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { ProviderLeadForm } from '../features/providers/ProviderLeadForm'
import { getProviderBySlug } from '../features/providers/api'
import type { ProviderDetail } from '../features/providers/types'
import { trackEvent } from '../lib/analytics'

export function ProviderDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [provider, setProvider] = useState<ProviderDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)

  useEffect(() => {
    void getProviderBySlug(slug)
      .then((row) => {
        setProvider(row)
        setErrorMessage(null)
        trackEvent('provider_detail_viewed', { providerSlug: row.slug })
      })
      .catch((error) =>
        setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el proveedor.'),
      )
  }, [slug])

  if (errorMessage) {
    return (
      <section className="content-card stack">
        <h2>Proveedor no encontrado</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    )
  }

  if (!provider) {
    return (
      <section className="content-card stack">
        <h2>Cargando proveedor</h2>
        <p className="helper-text">Estamos preparando la ficha comercial.</p>
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
            <span className="user-badge">{provider.category.name}</span>
            {provider.isVerified ? <span className="user-badge">Verificado</span> : null}
          </div>
        </div>
        <div className="chip-grid">
          {provider.countries.map((item) => (
            <span key={item} className="chip chip--active">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="info-card stack">
        <h3>Descripción</h3>
        <p>{provider.longDescription || provider.shortDescription}</p>
      </div>

      <div className="info-card stack">
        <h3>Productos y servicios</h3>
        <div className="chip-grid">
          {provider.productsServices.map((item) => (
            <span key={item} className="chip chip--active">
              {item}
            </span>
          ))}
        </div>
        {provider.website ? (
          <p>
            Sitio web:{' '}
            <a className="inline-link" href={provider.website} target="_blank" rel="noreferrer">
              {provider.website}
            </a>
          </p>
        ) : null}
      </div>

      <div className="info-card stack">
        <div className="split-header">
          <div className="stack">
            <h3>Contacto interno</h3>
            <p className="helper-text">
              El primer contacto se registra dentro de Zucarlink sin exponer datos sensibles.
            </p>
          </div>
          {user ? (
            <button
              className="button"
              type="button"
              onClick={() => setShowLeadForm((current) => !current)}
            >
              Contactar proveedor
            </button>
          ) : (
            <Link
              className="button"
              role="button"
              to="/login"
              state={{ from: location }}
            >
              Contactar proveedor
            </Link>
          )}
        </div>
        {user && showLeadForm ? (
          <ProviderLeadForm
            providerId={provider.id}
            onSubmitted={() => trackEvent('provider_lead_submitted', { providerSlug: provider.slug })}
          />
        ) : null}
      </div>
    </section>
  )
}
