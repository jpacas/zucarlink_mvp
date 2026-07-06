import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { updateProviderLeadStatus } from '../features/providers/api'
import { getProviderStatusMeta } from '../features/providers/status'
import { useCurrentProviderProfile } from '../features/providers/useCurrentProviderProfile'
import { useProviderLeads } from '../features/providers/useProviderLeads'
import type { ProviderLead, ProviderLeadStatus } from '../features/providers/types'
import { trackEvent } from '../lib/analytics'

const STATUS_LABELS: Record<ProviderLeadStatus, string> = {
  new: 'Nueva',
  reviewed: 'Revisada',
  contacted: 'Contactada',
  closed: 'Cerrada',
}

const STATUS_ORDER: ProviderLeadStatus[] = ['new', 'reviewed', 'contacted', 'closed']

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AppProviderLeadsPage() {
  const { user } = useAuth()
  const { leads, setLeads, isLoading, errorMessage } = useProviderLeads(user)
  const { provider } = useCurrentProviderProfile(user)
  const [statusFilter, setStatusFilter] = useState<ProviderLeadStatus | ''>('')
  const [feedback, setFeedback] = useState<string | null>(null)

  // Si aún no podemos leer el estado, asumimos pública para no introducir alarmas falsas.
  const isFichaPublic = provider ? getProviderStatusMeta(provider.status).isPublic : true

  useEffect(() => {
    trackEvent('provider_leads_viewed')
  }, [])

  const visibleLeads = useMemo(
    () => (statusFilter ? leads.filter((lead) => lead.status === statusFilter) : leads),
    [leads, statusFilter],
  )
  const newCount = useMemo(() => leads.filter((lead) => lead.status === 'new').length, [leads])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  async function handleStatusChange(lead: ProviderLead, nextStatus: ProviderLeadStatus) {
    const previousStatus = lead.status
    setFeedback(null)
    // Actualización optimista: reflejamos el cambio y revertimos si el backend falla.
    setLeads((current) =>
      current.map((entry) => (entry.id === lead.id ? { ...entry, status: nextStatus } : entry)),
    )

    try {
      await updateProviderLeadStatus(lead.id, nextStatus)
      trackEvent('provider_lead_status_changed', { leadId: lead.id, status: nextStatus })
    } catch (error) {
      setLeads((current) =>
        current.map((entry) =>
          entry.id === lead.id ? { ...entry, status: previousStatus } : entry,
        ),
      )
      setFeedback(
        error instanceof Error ? error.message : 'No fue posible actualizar la solicitud.',
      )
    }
  }

  return (
    <div className="stack">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/app' },
          { label: 'Perfil comercial', to: '/app/provider' },
          { label: 'Solicitudes' },
        ]}
      />
      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Proveedor</p>
            <h2>Solicitudes de contacto</h2>
            <p>
              {isFichaPublic
                ? 'Solicitudes que llegan desde tu ficha pública en el directorio de proveedores.'
                : 'Tu ficha aún no es pública. Cuando se active y alguien te contacte desde el directorio, las solicitudes aparecerán aquí.'}
            </p>
          </div>
          {newCount > 0 ? (
            <span className="user-badge">{newCount} nuevas</span>
          ) : null}
        </div>

        {leads.length > 0 ? (
          <div className="field">
            <label htmlFor="leads-status-filter">Filtrar por estado</label>
            <select
              id="leads-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProviderLeadStatus | '')}
            >
              <option value="">Todas</option>
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {feedback ? <p className="error-text">{feedback}</p> : null}

        {isLoading ? (
          <p className="helper-text">Cargando solicitudes…</p>
        ) : null}
        {!isLoading && errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && visibleLeads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 14l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>{leads.length === 0 ? 'Sin solicitudes' : 'Sin resultados para este filtro'}</h3>
            <p>
              {leads.length === 0
                ? 'Aún no tienes solicitudes. Cuando alguien te contacte desde el directorio, aparecerá aquí.'
                : 'No hay solicitudes con ese estado.'}
            </p>
          </div>
        ) : null}

        <div className="stack" data-testid="provider-leads">
          {visibleLeads.map((lead) => (
            <article key={lead.id} className="info-card stack">
              <div className="split-header">
                <div className="stack stack--compact">
                  <h3>{lead.name}</h3>
                  <p className="helper-text">
                    {lead.company ? `${lead.company} · ` : ''}
                    {formatDate(lead.createdAt)}
                  </p>
                </div>
                <span className="user-badge">{STATUS_LABELS[lead.status]}</span>
              </div>
              <p>{lead.message}</p>
              <div className="actions">
                <a className="button button--ghost button--sm" href={`mailto:${lead.email}`}>
                  {lead.email}
                </a>
                <div className="field">
                  <label htmlFor={`lead-status-${lead.id}`} className="sr-only">
                    Estado de la solicitud de {lead.name}
                  </label>
                  <select
                    id={`lead-status-${lead.id}`}
                    value={lead.status}
                    onChange={(event) =>
                      void handleStatusChange(lead, event.target.value as ProviderLeadStatus)
                    }
                  >
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
