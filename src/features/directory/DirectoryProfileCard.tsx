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
          <h3>{profile.fullName}</h3>
          <p className="directory-card__meta">
            {profile.currentRole || 'Cargo pendiente'}
            {profile.organizationName ? ` · ${profile.organizationName}` : ''}
          </p>
          {profile.country ? (
            <span className="directory-card__country">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 1.5c-2.49 0-4.5 2-4.5 4.47C3.5 9.3 8 14.5 8 14.5s4.5-5.2 4.5-8.53C12.5 3.5 10.49 1.5 8 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              {profile.country}
            </span>
          ) : null}
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
        <Link className="button button--sm" to={`/app/messages?to=${profile.id}`}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="m2.5 4.5 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mensaje
        </Link>
        <Link className="button button--secondary button--sm" to={`/app/directory/${profile.id}`}>
          Ver perfil →
        </Link>
      </div>
    </article>
  )
}
