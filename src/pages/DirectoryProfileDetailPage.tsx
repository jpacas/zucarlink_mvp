import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getDirectoryProfileDetail } from '../features/directory/api'
import type { DirectoryProfileDetail } from '../features/directory/types'

function verificationLabel(status: DirectoryProfileDetail['verificationStatus']) {
  switch (status) {
    case 'verified':
      return 'Verificado'
    case 'pending':
      return 'Verificación pendiente'
    default:
      return 'Sin verificar'
  }
}

export function DirectoryProfileDetailPage() {
  const { profileId = '' } = useParams()
  const [profile, setProfile] = useState<DirectoryProfileDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    void getDirectoryProfileDetail(profileId)
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar el perfil.',
          )
          setProfile(null)
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
  }, [profileId])

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando perfil</h2>
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
            <p className="eyebrow">Directorio privado</p>
            <h2>{profile.fullName}</h2>
            <p>
              {profile.currentRole || 'Cargo pendiente'}
              {profile.organizationName ? ` · ${profile.organizationName}` : ''}
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

      <div className="info-card stack">
        <h3>Privacidad</h3>
        <p className="helper-text">
          Este detalle solo muestra información profesional. Los datos de contacto personales
          se mantienen ocultos por defecto.
        </p>
      </div>
    </section>
  )
}
