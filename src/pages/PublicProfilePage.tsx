import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Breadcrumbs } from '../components/Breadcrumbs'
import { getProfileForumActivity, getPublicMemberProfile } from '../features/profile/public-api'
import type { PublicMemberProfile, PublicProfileForumActivity } from '../features/profile/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'

function verificationLabel(status: PublicMemberProfile['verificationStatus']) {
  switch (status) {
    case 'verified':
      return 'Verificado'
    case 'pending':
      return 'Verificación pendiente'
    default:
      return 'Sin verificar'
  }
}

export function PublicProfilePage() {
  const { profileId = '' } = useParams()
  const [profile, setProfile] = useState<PublicMemberProfile | null>(null)
  const [activity, setActivity] = useState<PublicProfileForumActivity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasAvatarError, setHasAvatarError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    void Promise.all([
      getPublicMemberProfile(profileId),
      getProfileForumActivity(profileId),
    ])
      .then(([nextProfile, nextActivity]) => {
        if (!isMounted) {
          return
        }

        setProfile(nextProfile)
        setActivity(nextActivity)
        setErrorMessage(null)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'No fue posible abrir el perfil.')
        setProfile(null)
        setActivity(null)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [profileId])

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando perfil</h2>
        <p className="helper-text">Estamos abriendo la ficha pública del autor.</p>
      </section>
    )
  }

  if (!profile || errorMessage) {
    const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

    return (
      <section className="content-card stack">
        <h2>Perfil no disponible</h2>
        <p className={isPublicDataUnavailable ? 'helper-text' : 'error-text'}>
          {isPublicDataUnavailable
            ? 'El perfil público estará disponible pronto.'
            : errorMessage ?? 'No encontramos el perfil solicitado.'}
        </p>
        <Link className="button button--secondary" to="/forum">
          Volver al foro
        </Link>
      </section>
    )
  }

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Directorio', to: '/directory' },
        { label: profile.fullName },
      ]} />
      <section className="content-card stack">
      <div className="split-header">
        <div className="profile-header">
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
            <p className="eyebrow">Perfil público</p>
            <h2>{profile.fullName}</h2>
            <p>
              {profile.currentRole || 'Cargo pendiente'}
              {profile.organizationName ? ` · ${profile.organizationName}` : ''}
            </p>
            <div className="actions">
              {profile.country ? <span className="user-badge">{profile.country}</span> : null}
              <span className="user-badge">{verificationLabel(profile.verificationStatus)}</span>
            </div>
          </div>
        </div>
        <Link className="button button--secondary" to="/forum">
          Volver al foro
        </Link>
      </div>

      <div className="info-card stack">
        <h3>Resumen profesional</h3>
        <p>{profile.shortBio || 'Este miembro todavía no añadió un resumen público.'}</p>
      </div>

      <div className="info-card stack">
        <h3>Actividad en foro</h3>
        <div className="actions">
          <span className="user-badge">{activity?.threadCount ?? 0} temas</span>
          <span className="user-badge">{activity?.replyCount ?? 0} respuestas</span>
        </div>
        {activity && activity.topCategories.length > 0 ? (
          <div className="chip-grid">
            {activity.topCategories.map((category) => (
              <span key={category} className="chip chip--active">
                {category}
              </span>
            ))}
          </div>
        ) : (
          <p className="helper-text">Todavía no hay categorías destacadas para este miembro.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Contribuciones recientes</h3>
        {activity && activity.recentContributions.length > 0 ? (
          <div className="stack">
            {activity.recentContributions.map((item) => (
              <Link
                key={item.id}
                className="inline-link"
                to={`/forum/thread/${item.slug}`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        ) : (
          <p className="helper-text">Aún no hay contribuciones visibles en el foro.</p>
        )}
      </div>
    </section>
    </div>
  )
}
