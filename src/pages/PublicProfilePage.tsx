import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { Breadcrumbs } from '../components/Breadcrumbs'
import { useAuth } from '../features/auth/AuthProvider'
import { getMemberProfilePath } from '../features/directory/memberProfilePath'
import { getProfileForumActivity, getPublicMemberProfile } from '../features/profile/public-api'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { getInitials } from '../lib/initials'
import { useAsyncData } from '../lib/useAsyncData'
import { usePageMetadata } from '../lib/usePageMetadata'

export function PublicProfilePage() {
  const { profileId = '' } = useParams()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [hasAvatarError, setHasAvatarError] = useState(false)

  const { data, isLoading, error: errorMessage } = useAsyncData(
    () =>
      Promise.all([getPublicMemberProfile(profileId), getProfileForumActivity(profileId)]).then(
        ([nextProfile, nextActivity]) => ({ profile: nextProfile, activity: nextActivity }),
      ),
    [profileId],
  )
  const profile = data?.profile ?? null
  const activity = data?.activity ?? null

  usePageMetadata({
    title: profile?.fullName ?? 'Perfil público',
    description: profile?.shortBio || undefined,
  })

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando perfil</h2>
        <p className="helper-text">Estamos abriendo la ficha pública del autor.</p>
      </section>
    )
  }

  if (!isAuthLoading && user) {
    return <Navigate to={getMemberProfilePath(profileId, true)} replace />
  }

  if (!profile || errorMessage) {
    const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

    return (
      <section className="content-card stack">
        <h1>Perfil no disponible</h1>
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
              width={88}
              height={88}
              loading="lazy"
              decoding="async"
              onError={() => setHasAvatarError(true)}
            />
          ) : (
            <div className="avatar-fallback" aria-hidden="true">
              {getInitials(profile.fullName)}
            </div>
          )}
          <div className="stack stack--compact">
            <p className="eyebrow">Perfil público</p>
            <h1>{profile.fullName}</h1>
            {profile.currentRole || profile.organizationName ? (
              <p>{[profile.currentRole, profile.organizationName].filter(Boolean).join(' · ')}</p>
            ) : null}
            <div className="actions">
              {profile.country ? <span className="user-badge">{profile.country}</span> : null}
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
