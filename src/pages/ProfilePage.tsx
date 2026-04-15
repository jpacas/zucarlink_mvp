import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { useCurrentProfile } from '../features/profile/useCurrentProfile'

function verificationLabel(status: 'unverified' | 'pending' | 'verified') {
  switch (status) {
    case 'verified':
      return 'Verificado'
    case 'pending':
      return 'Verificación pendiente'
    default:
      return 'Sin verificar'
  }
}

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, isLoading, errorMessage } = useCurrentProfile(user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando perfil</h2>
        <p className="helper-text">Estamos trayendo tu ficha técnica-profesional.</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="content-card stack">
        <h2>Perfil</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="content-card stack">
        <h2>Perfil</h2>
        <p className="helper-text">Tu perfil todavía no está disponible.</p>
        <div className="actions">
          <Link className="button" to="/onboarding">
            Completar onboarding
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="profile-header">
          {profile.avatarUrl ? (
            <img className="avatar-image" src={profile.avatarUrl} alt={profile.fullName} />
          ) : (
            <div className="avatar-fallback" aria-hidden="true">
              {profile.fullName.slice(0, 1).toUpperCase() || 'Z'}
            </div>
          )}
          <div className="stack">
            <p className="eyebrow">Ficha técnica-profesional</p>
            <h2>{profile.fullName}</h2>
            <p>
              {profile.roleTitle || 'Cargo pendiente'} ·{' '}
              {profile.companyName || 'Empresa / ingenio pendiente'}
            </p>
            <div className="actions">
              {profile.country ? <span className="user-badge">{profile.country}</span> : null}
              {profile.yearsExperience !== null ? (
                <span className="user-badge">{profile.yearsExperience} años</span>
              ) : null}
              <span className="user-badge">
                {verificationLabel(profile.verificationStatus)}
              </span>
            </div>
          </div>
        </div>
        <Link className="button button--secondary" to="/app/profile/edit">
          Editar perfil
        </Link>
      </div>

      <div className="info-card stack">
        <h3>Resumen profesional</h3>
        <p>
          {profile.shortBio ||
            'Agrega un resumen profesional para reforzar credibilidad y contexto.'}
        </p>
      </div>

      <div className="info-card stack">
        <h3>Especialidades técnicas</h3>
        {profile.specialties.length > 0 ? (
          <div className="chip-grid">
            {profile.specialties.map((specialty) => (
              <span key={specialty.id} className="chip chip--active">
                {specialty.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="helper-text">Agrega al menos una especialidad técnica.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Experiencia profesional</h3>
        {profile.experiences.length > 0 ? (
          profile.experiences.map((experience) => (
            <article key={experience.id} className="stack">
              <strong>
                {experience.roleTitle} · {experience.companyName}
              </strong>
              <span className="helper-text">
                {experience.startDate} ·{' '}
                {experience.isCurrent ? 'Actual' : experience.endDate ?? 'Sin cierre'}
              </span>
              {experience.description ? <p>{experience.description}</p> : null}
              {experience.achievements ? (
                <p className="helper-text">Logros: {experience.achievements}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="helper-text">Todavía no hay experiencia registrada.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Contacto</h3>
        <p>
          Email: <strong>{profile.email ?? 'Sin email disponible'}</strong>
        </p>
        <p className="helper-text">Teléfono y WhatsApp quedan ocultos por defecto.</p>
        {profile.linkedinUrl ? (
          <p>
            LinkedIn:{' '}
            <a className="inline-link" href={profile.linkedinUrl} target="_blank" rel="noreferrer">
              {profile.linkedinUrl}
            </a>
          </p>
        ) : null}
        <button className="button button--secondary" type="button" disabled>
          Contacto interno próximamente
        </button>
      </div>
    </section>
  )
}
