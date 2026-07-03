import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { NotificationPreferencesCard } from '../features/notifications/NotificationPreferencesCard'
import { Breadcrumbs } from '../components/Breadcrumbs'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="stack">
    <Breadcrumbs items={[
      { label: 'Panel', to: '/app' },
      { label: 'Ajustes' },
    ]} />
    <section className="content-card stack">
      <div className="stack">
        <p className="eyebrow">Cuenta</p>
        <h2>Ajustes</h2>
        <p>Gestiona el acceso, la seguridad y las preferencias de tu cuenta.</p>
      </div>

      <div className="section-grid compact-grid">
        <article className="info-card stack">
          <h3>Sesión activa</h3>
          <p>
            <strong>{user?.email ?? 'Sin email disponible'}</strong>
          </p>
          <p className="helper-text">Esta es la cuenta con la que estás navegando en este momento.</p>
          <div className="actions">
            <Link className="inline-link" to="/app/profile">Ver perfil</Link>
            <Link className="inline-link" to="/app/profile/edit">Editar perfil</Link>
          </div>
        </article>

        <article className="info-card stack">
          <h3>Seguridad</h3>
          <p className="helper-text">
            Para cambiar tu contraseña, te enviamos un enlace al correo registrado. El enlace expira en 60 minutos.
          </p>
          <div className="actions">
            <Link className="button button--secondary" to="/recuperar-contrasena">
              Cambiar contraseña
            </Link>
          </div>
        </article>

        {user ? <NotificationPreferencesCard userId={user.id} /> : null}
      </div>
    </section>
    </div>
  )
}
