import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

export function PrivateLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const accountType = user?.user_metadata?.account_type
  const isAdmin = Boolean(user?.user_metadata?.is_admin)
  const privateLinks =
    accountType === 'provider'
      ? [
          { to: '/app', label: 'Panel' },
          { to: '/proveedores/directorio', label: 'Directorio' },
          { to: '/app/provider', label: 'Perfil comercial' },
          { to: '/app/provider/edit', label: 'Editar perfil' },
          { to: '/app/settings', label: 'Ajustes' },
        ]
      : [
          { to: '/app', label: 'Panel' },
          { to: '/app/directory', label: 'Directorio' },
          { to: '/forum', label: 'Foro' },
          { to: '/app/profile', label: 'Perfil' },
          { to: '/app/messages', label: 'Mensajes' },
          { to: '/app/settings', label: 'Ajustes' },
        ]
  const allLinks = isAdmin
    ? [
        ...privateLinks,
        { to: '/app/admin/dashboard', label: 'Dashboard gerencial' },
        { to: '/app/providers-admin', label: 'Admin proveedores' },
      ]
    : privateLinks

  async function handleLogout() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="stack">
          <div>
            <p className="eyebrow">Mi cuenta</p>
            <h1>Zucarlink</h1>
          </div>
          <span className="user-badge">{user?.email}</span>
        </div>
        <div className="actions">
          <nav className="main-nav" aria-label="Privada">
            {allLinks.map((link) => (
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
