import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

export function SettingsPage() {
  const { user } = useAuth()

  return (
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

        <article className="info-card stack settings-notifications">
          <div className="settings-notifications__header">
            <div className="stack stack--compact">
              <h3>Notificaciones</h3>
              <p className="helper-text">Controla qué correos recibes de Zucarlink.</p>
            </div>
            <span className="tag-badge">Próximamente</span>
          </div>
          <div className="settings-toggle-list">
            <div className="settings-toggle-item">
              <div className="stack stack--compact">
                <strong>Mensajes directos</strong>
                <span className="helper-text">Nuevo mensaje de otro miembro</span>
              </div>
              <div className="settings-toggle-item__control settings-toggle-item__control--disabled" aria-disabled="true" />
            </div>
            <div className="settings-toggle-item">
              <div className="stack stack--compact">
                <strong>Actividad en el foro</strong>
                <span className="helper-text">Respuestas a tus temas</span>
              </div>
              <div className="settings-toggle-item__control settings-toggle-item__control--disabled" aria-disabled="true" />
            </div>
            <div className="settings-toggle-item">
              <div className="stack stack--compact">
                <strong>Novedades de la plataforma</strong>
                <span className="helper-text">Nuevas funciones y anuncios</span>
              </div>
              <div className="settings-toggle-item__control settings-toggle-item__control--disabled" aria-disabled="true" />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
