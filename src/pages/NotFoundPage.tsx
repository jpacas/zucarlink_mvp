import { Link } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

export function NotFoundPage() {
  const { user } = useAuth()

  return (
    <section className="content-card stack">
      <div className="empty-state">
        <div className="empty-state__icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10l8 8M18 10l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3>Página no encontrada</h3>
        <p>La dirección a la que intentaste llegar no existe o ya no está disponible.</p>
        <div className="actions">
          <Link className="button" to={user ? '/app' : '/'}>
            {user ? 'Volver al panel' : 'Volver al inicio'}
          </Link>
        </div>
      </div>
    </section>
  )
}
