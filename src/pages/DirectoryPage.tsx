import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAuth } from '../features/auth/AuthProvider'
import { getDirectoryPublicSummary, listPublicPreviewProfiles, type PublicPreviewProfile } from '../features/directory/api'
import type { DirectoryAggregateSnapshot } from '../features/directory/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'

const emptySummary: DirectoryAggregateSnapshot = {
  totalMembers: 0,
  totalCountries: 0,
  totalCompanies: 0,
  totalSpecialties: 0,
}

const summaryCards = [
  {
    key: 'totalMembers',
    label: 'Miembros visibles',
    description: 'Perfiles técnicos completos listos para descubrimiento privado.',
  },
  {
    key: 'totalCountries',
    label: 'Países activos',
    description: 'Presencia regional actual dentro de la red.',
  },
  {
    key: 'totalCompanies',
    label: 'Ingenios y empresas',
    description: 'Organizaciones representadas con perfiles completos.',
  },
  {
    key: 'totalSpecialties',
    label: 'Especialidades',
    description: 'Áreas técnicas visibles para explorar después de iniciar sesión.',
  },
] satisfies Array<{
  key: keyof DirectoryAggregateSnapshot
  label: string
  description: string
}>

function PublicProfileCard({ profile }: { profile: PublicPreviewProfile }) {
  const [hasAvatarError, setHasAvatarError] = useState(false)

  return (
    <article className="directory-card directory-card--public">
      <div className="directory-card__header">
        {profile.avatarUrl && !hasAvatarError ? (
          <img
            className="avatar-image"
            src={profile.avatarUrl}
            alt={profile.fullName}
            onError={() => setHasAvatarError(true)}
          />
        ) : (
          <div className="avatar-fallback" aria-hidden="true">
            {profile.fullName.slice(0, 1).toUpperCase() || 'Z'}
          </div>
        )}
        <div className="stack stack--compact">
          <div className="actions">
            <h3>{profile.fullName}</h3>
            {profile.isVerified ? <span className="user-badge">Verificado</span> : null}
          </div>
          <p className="directory-card__meta">
            {profile.roleTitle || 'Cargo pendiente'}
            {profile.organizationName ? ` · ${profile.organizationName}` : ''}
          </p>
          {profile.country ? <span className="route-chip">{profile.country}</span> : null}
        </div>
      </div>

      {profile.specialties.length > 0 ? (
        <div className="chip-grid">
          {profile.specialties.slice(0, 3).map((specialty) => (
            <span key={specialty} className="chip chip--active">
              {specialty}
            </span>
          ))}
        </div>
      ) : null}

      <div className="directory-card__public-cta">
        <Link className="button button--secondary" to="/register">
          Conectar →
        </Link>
      </div>
    </article>
  )
}

export function DirectoryPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DirectoryAggregateSnapshot>(emptySummary)
  const [previewProfiles, setPreviewProfiles] = useState<PublicPreviewProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const isPublicSummaryUnavailable = isPublicConfigurationError(errorMessage)

  useEffect(() => {
    let isMounted = true

    void Promise.all([
      getDirectoryPublicSummary(),
      listPublicPreviewProfiles(12),
    ])
      .then(([nextSummary, nextProfiles]) => {
        if (isMounted) {
          setSummary(nextSummary)
          setPreviewProfiles(nextProfiles)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar el directorio.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [retryToken])

  return (
    <div className="stack">
      <section className="hero-card stack">
        <p className="eyebrow">Directorio público</p>
        <h2>Directorio de la industria azucarera</h2>
        <p>
          Técnicos, especialistas y profesionales del sector en una red curada. El detalle
          completo y el contacto directo están disponibles dentro del área autenticada.
        </p>
        <div className="actions">
          {user ? (
            <Link className="button" to="/app/directory">
              Abrir directorio privado
            </Link>
          ) : (
            <Link className="button" to="/register">
              Crear mi perfil técnico
            </Link>
          )}
          <Link className="button button--secondary" to={user ? '/app' : '/login'}>
            {user ? 'Volver al panel' : 'Ingresar'}
          </Link>
        </div>
      </section>

      <section className="section-grid section-grid--directory">
        {summaryCards.map((card) => (
          <article key={card.key} className="content-card stack">
            <p className="eyebrow">{card.label}</p>
            <h3 className="metric-value">
              {isLoading ? '...' : summary[card.key].toLocaleString('es-SV')}
            </h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      {/* Public profile preview */}
      {(isLoading || previewProfiles.length > 0) ? (
        <section className="content-card stack">
          <div className="split-header">
            <div className="stack stack--compact">
              <p className="eyebrow">Vista previa</p>
              <h3>Miembros activos</h3>
            </div>
            {!user ? (
              <Link className="button" to="/register">
                Ver todos al registrarte
              </Link>
            ) : null}
          </div>

          {isLoading ? (
            <p className="helper-text">Cargando perfiles...</p>
          ) : (
            <div className="directory-grid">
              {previewProfiles.map((profile) => (
                <PublicProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          )}

          {!user ? (
            <div className="directory-public-cta-banner">
              <p>
                <strong>Regístrate gratis</strong> para ver perfiles completos, especialidades,
                experiencia y contactar directamente dentro de la red.
              </p>
              <Link className="button" to="/register">
                Crear mi perfil técnico
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Privacidad primero</p>
            <h3>Qué puedes evaluar desde aquí</h3>
          </div>
        </div>
        <ul className="list">
          <li>Señales de presencia: miembros, países, empresas y especialidades.</li>
          <li>No se muestran emails, teléfonos, WhatsApp ni detalles de contacto.</li>
          <li>El perfil completo y el contacto directo se habilitan al entrar con tu cuenta.</li>
        </ul>
        {isPublicSummaryUnavailable ? (
          <p className="helper-text">El resumen público estará disponible pronto.</p>
        ) : errorMessage ? (
          <div className="stack stack--compact">
            <p className="error-text">{errorMessage}</p>
            <div className="actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setRetryToken((current) => current + 1)}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
