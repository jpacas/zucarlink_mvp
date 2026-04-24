import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { getProfileCompleteness } from '../features/profile/profile-status'
import { useCurrentProfile } from '../features/profile/useCurrentProfile'
import { Skeleton } from '../components/Skeleton'

export function AppHomePage() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useCurrentProfile(user)
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Miembro'
  const accountType = user?.user_metadata?.account_type as string | undefined
  const isProvider = accountType === 'provider'

  const completeness =
    !isProvider && profile
      ? getProfileCompleteness(
          {
            country: profile.country,
            roleTitle: profile.roleTitle,
            companyName: profile.companyName,
            yearsExperience: profile.yearsExperience,
            shortBio: profile.shortBio,
          },
          profile.specialties,
        )
      : null

  const topMissingField = completeness?.missingFields[0] ?? null
  const isComplete = completeness ? completeness.percent === 100 : true

  return (
    <div className="stack">
      <section className="hero-card stack">
        <p className="eyebrow">Mi cuenta</p>
        <h2>Tu espacio en Zucarlink</h2>
        <p>
          {isProvider
            ? `${fullName}, mantén visible tu perfil comercial y responde con rapidez a las oportunidades que lleguen desde la red.`
            : `${fullName}, mantén tu perfil al día y vuelve al foro o al directorio cuando necesites contexto técnico o nuevos contactos.`}
        </p>
        <div className="actions">
          <Link className="button" to={isProvider ? '/app/provider' : '/app/profile'}>
            {isProvider ? 'Ver perfil comercial' : 'Ver perfil'}
          </Link>
          <Link className="button button--secondary" to={isProvider ? '/app/provider/edit' : '/app/profile/edit'}>
            {isProvider ? 'Editar perfil comercial' : 'Actualizar perfil'}
          </Link>
        </div>
      </section>

      {/* Profile completeness widget — skeleton while loading, then real data */}
      {!isProvider && profileLoading ? (
        <section className="content-card stack profile-completeness">
          <div className="profile-completeness__header">
            <div className="stack stack--compact" style={{ flex: 1 }}>
              <Skeleton variant="text" width="80px" />
              <Skeleton variant="heading" />
              <Skeleton variant="text" width="90%" />
            </div>
            <span className="profile-completeness__ring" aria-hidden="true">
              <Skeleton variant="text" width="40px" />
            </span>
          </div>
          <div className="profile-completeness__bar-wrap">
            <div className="profile-completeness__bar" style={{ width: '40%' }} />
          </div>
        </section>
      ) : null}

      {!isProvider && !profileLoading && completeness && !isComplete ? (
        <section className="content-card stack profile-completeness">
          <div className="profile-completeness__header">
            <div className="stack stack--compact">
              <p className="eyebrow">Tu perfil</p>
              <h3>Perfil {completeness.percent}% completo</h3>
              <p className="helper-text">
                Un perfil completo aparece en el directorio y puede participar en el foro.
              </p>
            </div>
            <span className="profile-completeness__ring" aria-hidden="true">
              <span>{completeness.percent}%</span>
            </span>
          </div>

          <div className="profile-completeness__bar-wrap" role="progressbar" aria-valuenow={completeness.percent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="profile-completeness__bar"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>

          {topMissingField ? (
            <div className="actions">
              <Link className="button" to="/app/profile/edit">
                Agregar: {topMissingField.label}
              </Link>
              {completeness.missingFields.length > 1 ? (
                <span className="helper-text">
                  + {completeness.missingFields.length - 1} campo{completeness.missingFields.length - 1 > 1 ? 's' : ''} más
                </span>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="section-grid app-dashboard-grid">
        <article className="content-card stack">
          <p className="eyebrow">Acceso rápido</p>
          <h3>{isProvider ? 'Presencia comercial' : 'Identidad profesional'}</h3>
          <p>
            {isProvider
              ? 'Ajusta tu propuesta, cobertura y oferta para que la ficha pública mantenga una señal comercial sólida.'
              : 'Mantén visibles tu experiencia, especialidades y resumen para que el directorio siga siendo útil.'}
          </p>
          <div className="actions">
            <Link className="inline-link" to={isProvider ? '/app/provider/edit' : '/app/profile/edit'}>
              Abrir edición
            </Link>
          </div>
        </article>

        <article className="content-card stack">
          <p className="eyebrow">Movimiento</p>
          <h3>{isProvider ? 'Directorio y contacto' : 'Foro y directorio'}</h3>
          <p>
            {isProvider
              ? 'Revisa cómo se ve tu marca dentro del directorio y mantén listo el canal de contacto interno.'
              : 'Vuelve a los debates activos o revisa perfiles del directorio cuando necesites referencias del sector.'}
          </p>
          <div className="actions">
            <Link className="inline-link" to={isProvider ? '/proveedores/directorio' : '/forum'}>
              {isProvider ? 'Ver directorio de proveedores' : 'Ir al foro'}
            </Link>
            <Link className="inline-link" to={isProvider ? '/app/settings' : '/app/directory'}>
              {isProvider ? 'Revisar cuenta' : 'Abrir directorio'}
            </Link>
            {!isProvider ? (
              <Link className="inline-link" to="/app/messages">
                Mensajes
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  )
}
