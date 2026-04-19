import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { ProviderLogo } from '../features/providers/ProviderLogo'
import { listAdminProviders, updateProviderStatus } from '../features/providers/api'
import type { AdminProviderRecord, ProviderStatus } from '../features/providers/types'

const providerStatusActions: Record<
  ProviderStatus,
  Array<{ label: string; nextStatus: ProviderStatus; variant?: 'secondary' }>
> = {
  lead: [{ label: 'Activar', nextStatus: 'active' }],
  draft_profile: [{ label: 'Activar', nextStatus: 'active' }],
  active: [{ label: 'Desactivar', nextStatus: 'inactive', variant: 'secondary' }],
  inactive: [{ label: 'Activar', nextStatus: 'active' }],
}

export function AdminProvidersPage() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<AdminProviderRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null)
  const isAdmin = Boolean(user?.user_metadata?.is_admin)

  async function loadProviders() {
    setIsLoading(true)

    try {
      const rows = await listAdminProviders()
      setProviders(rows)
      setFeedback(null)
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No fue posible cargar la moderación.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    void loadProviders()
  }, [isAdmin])

  const orderedProviders = useMemo(
    () =>
      [...providers].sort((left, right) => {
        if (left.status === right.status) {
          return left.companyName.localeCompare(right.companyName)
        }

        return left.status.localeCompare(right.status)
      }),
    [providers],
  )

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  async function handleStatusChange(providerId: string, nextStatus: ProviderStatus) {
    setPendingProviderId(providerId)

    try {
      await updateProviderStatus(providerId, nextStatus)
      await loadProviders()
      setFeedback('Estado comercial actualizado.')
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No fue posible actualizar el estado.',
      )
    } finally {
      setPendingProviderId(null)
    }
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Admin</p>
          <h2>Moderación de proveedores</h2>
          <p>Activa o desactiva perfiles comerciales antes de publicarlos en el directorio.</p>
        </div>
      </div>

      {isLoading ? <p className="helper-text">Cargando proveedores.</p> : null}
      {feedback ? <p className={feedback.includes('No fue posible') ? 'error-text' : 'status'}>{feedback}</p> : null}

      <div className="stack">
        {!isLoading && orderedProviders.length === 0 ? (
          <p className="helper-text">No hay proveedores pendientes de moderación.</p>
        ) : null}

        {orderedProviders.map((provider) => (
          <article key={provider.id} className="info-card stack">
            <div className="split-header">
              <div className="provider-summary">
                <ProviderLogo companyName={provider.companyName} logoUrl={provider.logoUrl} size="sm" />
                <div className="stack">
                  <h3>{provider.companyName}</h3>
                  <div className="actions">
                    <span className="user-badge">{provider.category.name}</span>
                    <span className="user-badge">{provider.status}</span>
                    {provider.isVerified ? <span className="user-badge">Verificado</span> : null}
                  </div>
                </div>
              </div>
              <div className="chip-grid">
                {provider.countries.map((country) => (
                  <span key={country} className="chip chip--active">
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <p>{provider.shortDescription}</p>

            <div className="actions">
              {providerStatusActions[provider.status].map((action) => (
                <button
                  key={`${provider.id}-${action.nextStatus}`}
                  className={action.variant === 'secondary' ? 'button button--secondary' : 'button'}
                  type="button"
                  disabled={pendingProviderId === provider.id}
                  onClick={() => void handleStatusChange(provider.id, action.nextStatus)}
                >
                  {pendingProviderId === provider.id
                    ? 'Actualizando...'
                    : `${action.label} ${provider.companyName}`}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
