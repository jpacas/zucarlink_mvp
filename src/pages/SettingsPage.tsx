import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <section className="content-card stack">
      <div className="stack">
        <p className="eyebrow">Cuenta</p>
        <h2>Cuenta y acceso</h2>
        <p>Revisa la información de tu cuenta y mantén control directo sobre tu acceso.</p>
      </div>

      <div className="section-grid compact-grid">
        <article className="info-card stack">
          <h3>Sesión activa</h3>
          <p>
            <strong>{user?.email ?? 'Sin email disponible'}</strong>
          </p>
          <p className="helper-text">Esta es la cuenta con la que estás navegando en este momento.</p>
        </article>

        <article className="info-card stack">
          <h3>Accesos directos</h3>
          <div className="actions">
            <Link className="inline-link" to="/app/profile">
              Ver perfil
            </Link>
            <Link className="inline-link" to="/app/profile/edit">
              Editar perfil
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
