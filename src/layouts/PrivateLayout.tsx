import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

const privateLinks = [
  { to: '/app', label: 'Panel' },
  { to: '/app/profile', label: 'Perfil' },
  { to: '/app/messages', label: 'Mensajes' },
  { to: '/app/settings', label: 'Ajustes' },
]

export function PrivateLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="stack">
          <div>
            <p className="eyebrow">Área privada</p>
            <h1>Zucarlink</h1>
          </div>
          <span className="user-badge">{user?.email}</span>
        </div>
        <div className="actions">
          <nav className="main-nav" aria-label="Privada">
            {privateLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/app'}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link--active' : 'nav-link'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="button button--secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
