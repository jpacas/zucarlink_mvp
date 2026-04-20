import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

export function AppHomePage() {
  const { user } = useAuth()
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Miembro'
  const accountType = user?.user_metadata?.account_type as string | undefined
  const isProvider = accountType === 'provider'

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
          </div>
        </article>
      </section>
    </div>
  )
}
