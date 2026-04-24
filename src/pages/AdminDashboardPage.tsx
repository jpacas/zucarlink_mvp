import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  approveVerification,
  getAdminOperationalDashboard,
  listPendingVerifications,
  rejectVerification,
  type PendingVerification,
} from '../features/admin-dashboard/api'
import type {
  AdminOperationalDashboard,
  ContentStatusMetric,
  ForumCategoryMetric,
  ProviderLeadMetric,
} from '../features/admin-dashboard/types'
import { useAuth } from '../features/auth/AuthProvider'

const periodOptions = [7, 30, 90]

const kpiLabels: Array<{
  key: keyof AdminOperationalDashboard['kpis']
  label: string
  detail: string
}> = [
  { key: 'newUsers', label: 'Usuarios nuevos', detail: 'Altas en el periodo' },
  { key: 'completeProfiles', label: 'Perfiles completos', detail: 'Base lista para directorio' },
  { key: 'forumReplies', label: 'Respuestas foro', detail: 'Interacciones técnicas' },
  { key: 'providerLeads', label: 'Leads proveedores', detail: 'Solicitudes comerciales' },
  { key: 'activeProviders', label: 'Proveedores activos', detail: 'Oferta visible' },
  { key: 'publishedContent', label: 'Contenido publicado', detail: 'Noticias, blog, eventos y precios' },
]

export function AdminDashboardPage() {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.user_metadata?.is_admin)
  const [periodDays, setPeriodDays] = useState(30)
  const [dashboard, setDashboard] = useState<AdminOperationalDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [verificationLoading, setVerificationLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadPendingVerifications = useCallback(async () => {
    setVerificationLoading(true)

    try {
      const items = await listPendingVerifications()
      setPendingVerifications(items)
    } catch {
      // Non-critical: verification queue failure shouldn't crash dashboard
    } finally {
      setVerificationLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      void loadPendingVerifications()
    }
  }, [isAdmin, loadPendingVerifications])

  async function handleApprove(profileId: string) {
    setProcessingId(profileId)

    try {
      await approveVerification(profileId)
      await loadPendingVerifications()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No fue posible aprobar la verificación.')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(profileId: string) {
    setProcessingId(profileId)

    try {
      await rejectVerification(profileId)
      await loadPendingVerifications()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No fue posible rechazar la verificación.')
    } finally {
      setProcessingId(null)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    let isCurrent = true
    setIsLoading(true)

    void getAdminOperationalDashboard(periodDays)
      .then((nextDashboard) => {
        if (!isCurrent) {
          return
        }

        setDashboard(nextDashboard)
        setErrorMessage(null)
      })
      .catch((error) => {
        if (!isCurrent) {
          return
        }

        setDashboard(null)
        setErrorMessage(
          error instanceof Error ? error.message : 'No fue posible cargar el dashboard.',
        )
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [isAdmin, periodDays])

  const maxCountryCount = useMemo(
    () => Math.max(1, ...(dashboard?.countries.map((item) => item.userCount) ?? [0])),
    [dashboard?.countries],
  )
  const maxCompanyCount = useMemo(
    () => Math.max(1, ...(dashboard?.companies.map((item) => item.userCount) ?? [0])),
    [dashboard?.companies],
  )

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  return (
    <section className="content-card stack admin-dashboard">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Admin</p>
          <h2>Dashboard gerencial</h2>
          <p>
            Pulso operativo de usuarios, perfiles, foro, proveedores y contenido. Las
            visitas quedan fuera de esta v1 hasta instrumentar tracking persistente.
          </p>
        </div>
        <label className="field admin-dashboard__period" htmlFor="admin-dashboard-period">
          <span>Periodo</span>
          <select
            id="admin-dashboard-period"
            value={periodDays}
            onChange={(event) => setPeriodDays(Number(event.target.value))}
          >
            {periodOptions.map((option) => (
              <option key={option} value={option}>
                {option} días
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="actions">
        <span className="user-badge">Últimos {dashboard?.periodDays ?? periodDays} días</span>
        {dashboard ? (
          <span className="helper-text">Actualizado {formatDateTime(dashboard.generatedAt)}</span>
        ) : null}
      </div>

      {isLoading ? <p className="helper-text">Cargando dashboard gerencial.</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {dashboard ? (
        <>
          <div className="metric-grid">
            {kpiLabels.map((item) => (
              <article key={item.key} className="metric-card">
                <span>{item.label}</span>
                <strong>{formatNumber(dashboard.kpis[item.key])}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>

          <div className="dashboard-grid" data-testid="admin-dashboard-rankings">
            <RankingCard
              title="Países con más usuarios"
              emptyLabel="Sin datos para este periodo."
              items={dashboard.countries}
              maxValue={maxCountryCount}
              getLabel={(item) => item.country}
              getValue={(item) => item.userCount}
            />
            <RankingCard
              title="Ingenios y empresas"
              emptyLabel="Sin datos para este periodo."
              items={dashboard.companies}
              maxValue={maxCompanyCount}
              getLabel={(item) => item.companyName}
              getValue={(item) => item.userCount}
            />
          </div>

          <div className="dashboard-grid">
            <ForumCategoryCard items={dashboard.forumCategories} />
            <ProviderLeadCard items={dashboard.providerLeadsByProvider} />
          </div>

          <div className="dashboard-grid">
            <RecentForumTopics topics={dashboard.recentForumTopics} />
            <RecentProviderLeads leads={dashboard.recentProviderLeads} />
          </div>

          <div className="dashboard-grid">
            <RecentUsers dashboard={dashboard} />
            <ContentStatusCard items={dashboard.contentStatuses} />
          </div>
        </>
      ) : null}

      {/* Verification queue — always visible for admin, independent of period selector */}
      <article className="info-card stack">
        <div className="split-header">
          <h3>
            Cola de verificación
            {pendingVerifications.length > 0 ? (
              <span className="messages-unread-badge" style={{ marginLeft: '8px', verticalAlign: 'middle' }}>
                {pendingVerifications.length}
              </span>
            ) : null}
          </h3>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => void loadPendingVerifications()}
            disabled={verificationLoading}
          >
            {verificationLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {verificationLoading ? (
          <p className="helper-text">Cargando solicitudes pendientes...</p>
        ) : pendingVerifications.length === 0 ? (
          <p className="helper-text">No hay solicitudes de verificación pendientes.</p>
        ) : (
          <div className="compact-table">
            {pendingVerifications.map((profile) => (
              <div key={profile.id} className="compact-row compact-row--stack">
                <div className="split-header">
                  <div className="stack stack--compact">
                    <strong>{profile.fullName || 'Sin nombre'}</strong>
                    <span className="helper-text">
                      {profile.roleTitle || 'Sin cargo'}
                      {profile.organizationName ? ` · ${profile.organizationName}` : ''}
                      {profile.country ? ` · ${profile.country}` : ''}
                    </span>
                    {profile.shortBio ? (
                      <p className="helper-text" style={{ fontSize: '0.82rem' }}>
                        {profile.shortBio.slice(0, 120)}{profile.shortBio.length > 120 ? '…' : ''}
                      </p>
                    ) : null}
                  </div>
                  <div className="actions">
                    <Link
                      className="button button--secondary"
                      to={`/app/directory/${profile.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver perfil
                    </Link>
                    <button
                      type="button"
                      className="button"
                      disabled={processingId === profile.id}
                      onClick={() => void handleApprove(profile.id)}
                    >
                      {processingId === profile.id ? '...' : 'Aprobar'}
                    </button>
                    <button
                      type="button"
                      className="button button--secondary"
                      disabled={processingId === profile.id}
                      onClick={() => void handleReject(profile.id)}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

function RankingCard<T>({
  title,
  emptyLabel,
  items,
  maxValue,
  getLabel,
  getValue,
}: {
  title: string
  emptyLabel: string
  items: T[]
  maxValue: number
  getLabel: (item: T) => string
  getValue: (item: T) => number
}) {
  return (
    <article className="info-card stack">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="helper-text">{emptyLabel}</p> : null}
      <div className="ranking-list">
        {items.map((item) => {
          const value = getValue(item)
          return (
            <div key={getLabel(item)} className="ranking-row">
              <div className="split-header">
                <span>{getLabel(item)}</span>
                <strong>{formatNumber(value)}</strong>
              </div>
              <div className="ranking-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(8, (value / maxValue) * 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function ForumCategoryCard({ items }: { items: ForumCategoryMetric[] }) {
  return (
    <article className="info-card stack">
      <h3>Categorías activas del foro</h3>
      {items.length === 0 ? <p className="helper-text">Sin actividad de foro para este periodo.</p> : null}
      <div className="compact-table">
        {items.map((item) => (
          <div key={item.categoryName} className="compact-row">
            <span>{item.categoryName}</span>
            <span>{formatNumber(item.topicCount)} temas</span>
            <strong>{formatNumber(item.replyCount)} respuestas</strong>
          </div>
        ))}
      </div>
    </article>
  )
}

function ProviderLeadCard({ items }: { items: ProviderLeadMetric[] }) {
  return (
    <article className="info-card stack">
      <h3>Leads por proveedor</h3>
      {items.length === 0 ? <p className="helper-text">Sin leads comerciales para este periodo.</p> : null}
      <div className="compact-table">
        {items.map((item) => (
          <div key={item.providerName} className="compact-row">
            <span>{item.providerName}</span>
            <strong>{formatNumber(item.leadCount)} leads</strong>
          </div>
        ))}
      </div>
    </article>
  )
}

function RecentForumTopics({ topics }: { topics: AdminOperationalDashboard['recentForumTopics'] }) {
  return (
    <article className="info-card stack">
      <h3>Temas recientes</h3>
      {topics.length === 0 ? <p className="helper-text">No hay registros recientes para este periodo.</p> : null}
      <div className="compact-table">
        {topics.map((topic) => (
          <div key={topic.id} className="compact-row compact-row--stack">
            <strong>{topic.title}</strong>
            <span>
              {topic.categoryName} · {topic.authorName} · {formatNumber(topic.replyCount)} respuestas
            </span>
            <small>{formatDateTime(topic.lastActivityAt)}</small>
          </div>
        ))}
      </div>
    </article>
  )
}

function RecentProviderLeads({ leads }: { leads: AdminOperationalDashboard['recentProviderLeads'] }) {
  return (
    <article className="info-card stack">
      <h3>Leads recientes</h3>
      {leads.length === 0 ? <p className="helper-text">No hay registros recientes para este periodo.</p> : null}
      <div className="compact-table">
        {leads.map((lead) => (
          <div key={lead.id} className="compact-row compact-row--stack">
            <strong>{lead.leadName}</strong>
            <span>
              {lead.providerName}
              {lead.leadCompany ? ` · ${lead.leadCompany}` : ''}
            </span>
            <small>
              {lead.status} · {formatDateTime(lead.createdAt)}
            </small>
          </div>
        ))}
      </div>
    </article>
  )
}

function RecentUsers({ dashboard }: { dashboard: AdminOperationalDashboard }) {
  return (
    <article className="info-card stack">
      <h3>Usuarios recientes</h3>
      {dashboard.recentUsers.length === 0 ? <p className="helper-text">Sin usuarios recientes.</p> : null}
      <div className="compact-table">
        {dashboard.recentUsers.map((user) => (
          <div key={user.id} className="compact-row compact-row--stack">
            <strong>{user.fullName}</strong>
            <span>
              {user.accountType} · {user.country || 'Sin país'} ·{' '}
              {user.companyName || 'Sin empresa/ingenio'}
            </span>
            <small>
              {user.profileStatus} · {user.verificationStatus} · {formatDateTime(user.createdAt)}
            </small>
          </div>
        ))}
      </div>
    </article>
  )
}

function ContentStatusCard({ items }: { items: ContentStatusMetric[] }) {
  return (
    <article className="info-card stack">
      <h3>Contenido</h3>
      {items.length === 0 ? <p className="helper-text">Sin contenido cargado.</p> : null}
      <div className="compact-table">
        {items.map((item) => (
          <div key={`${item.contentGroup}-${item.status}`} className="compact-row">
            <span>
              {item.contentGroup} · {item.status}
            </span>
            <strong>{formatNumber(item.itemCount)}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-419').format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-419', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
