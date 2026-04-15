import { Link } from 'react-router-dom'

import type { DirectoryProfileCard as DirectoryProfileCardData } from './types'

interface DirectoryProfileCardProps {
  profile: DirectoryProfileCardData
}

export function DirectoryProfileCard({ profile }: DirectoryProfileCardProps) {
  return (
    <article className="directory-card">
      <div className="directory-card__header">
        {profile.avatarUrl ? (
          <img
            className="avatar-image"
            src={profile.avatarUrl}
            alt={profile.fullName}
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
            {profile.currentRole || 'Cargo pendiente'}
            {profile.organizationName ? ` · ${profile.organizationName}` : ''}
          </p>
          {profile.country ? <span className="route-chip">{profile.country}</span> : null}
        </div>
      </div>

      <p className="directory-card__headline">
        {profile.headline || 'Perfil técnico listo para explorarse dentro del directorio.'}
      </p>

      {profile.specialties.length > 0 ? (
        <div className="chip-grid">
          {profile.specialties.slice(0, 3).map((specialty) => (
            <span key={specialty} className="chip chip--active">
              {specialty}
            </span>
          ))}
        </div>
      ) : (
        <p className="helper-text">Sin especialidades visibles todavía.</p>
      )}

      <div className="actions">
        <Link className="button" to={`/app/directory/${profile.id}`}>
          Ver perfil de {profile.fullName}
        </Link>
      </div>
    </article>
  )
}
