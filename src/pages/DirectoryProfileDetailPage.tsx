import { Link, useParams } from 'react-router-dom'

import { Breadcrumbs } from '../components/Breadcrumbs'
import { getDirectoryProfileDetail } from '../features/directory/api'
import { getInitials } from '../lib/initials'
import { useAsyncData } from '../lib/useAsyncData'

export function DirectoryProfileDetailPage() {
  const { profileId = '' } = useParams()

  const { data: profile, isLoading, error: errorMessage } = useAsyncData(
    () => getDirectoryProfileDetail(profileId),
    [profileId],
  )

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando perfil…</h2>
        <p className="helper-text">Estamos abriendo la ficha técnica seleccionada.</p>
      </section>
    )
  }

  if (errorMessage || !profile) {
    return (
      <section className="content-card stack">
        <h2>Perfil no disponible</h2>
        <p className="error-text">{errorMessage ?? 'No encontramos el perfil solicitado.'}</p>
        <div className="actions">
          <Link className="button" to="/app/directory">
            Volver al directorio
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'Panel', to: '/app' },
        { label: 'Directorio', to: '/app/directory' },
        { label: profile.fullName },
      ]} />
      <section className="content-card stack">
      <div className="split-header">
        <div className="profile-header">
          {profile.avatarUrl ? (
            <img
              className="avatar-image"
              src={profile.avatarUrl}
              alt={profile.fullName}
              width={88}
              height={88}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="avatar-fallback" aria-hidden="true">
              {getInitials(profile.fullName)}
            </div>
          )}
          <div className="stack">
            <p className="eyebrow">Directorio privado</p>
            <h2>{profile.fullName}</h2>
            <p>
              {profile.currentRole || 'Cargo pendiente'}
              {profile.organizationName ? ` · ${profile.organizationName}` : ''}
            </p>
            <div className="actions">
              {profile.country ? <span className="user-badge">{profile.country}</span> : null}
              {profile.yearsExperience !== null ? (
                <span className="user-badge">{profile.yearsExperience} años de experiencia</span>
              ) : null}
            </div>
          </div>
        </div>
        <Link className="button button--secondary" to="/app/directory">
          Volver al directorio
        </Link>
      </div>

      <div className="info-card stack">
        <h3>Resumen profesional</h3>
        <p>
          {profile.shortBio ||
            profile.headline ||
            'Este miembro todavía no añadió un resumen profesional visible.'}
        </p>
      </div>

      <div className="info-card stack">
        <h3>Especialidades técnicas</h3>
        {profile.specialties.length > 0 ? (
          <div className="chip-grid">
            {profile.specialties.map((specialty) => (
              <span key={specialty} className="chip chip--active">
                {specialty}
              </span>
            ))}
          </div>
        ) : (
          <p className="helper-text">No hay especialidades visibles en este momento.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Experiencia profesional</h3>
        {profile.experiences.length > 0 ? (
          profile.experiences.map((experience) => (
            <article key={experience.id} className="stack">
              <strong>
                {experience.roleTitle} · {experience.companyName || 'Empresa por confirmar'}
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
          <p className="helper-text">Este perfil todavía no registra experiencia visible.</p>
        )}
      </div>

      <div className="info-card stack">
        <h3>Enviar mensaje privado</h3>
        <p className="helper-text">
          Conecta directamente sin exponer datos de contacto. Tus mensajes quedan dentro de Zucarlink.
        </p>
        <div className="actions">
          <Link
            className="button"
            to={`/app/messages?to=${profile.id}`}
          >
            Enviar mensaje a {profile.fullName.split(' ')[0]}
          </Link>
        </div>
      </div>

    </section>
    </div>
  )
}
