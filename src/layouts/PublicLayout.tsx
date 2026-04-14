import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/directory', label: 'Directorio' },
  { to: '/forum', label: 'Foro' },
  { to: '/providers', label: 'Proveedores' },
]

export function PublicLayout() {
  const { user } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Semana 4</p>
          <h1>Zucarlink</h1>
        </div>
        <nav className="main-nav" aria-label="Principal">
          {publicLinks.map((link) => (
            <NavItem key={link.to} to={link.to} label={link.label} />
          ))}
          {user ? (
            <NavItem to="/app" label="Mi cuenta" />
          ) : (
            <>
              <NavItem to="/login" label="Login" />
              <NavItem to="/register" label="Registro" />
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

interface NavItemProps {
  label: string
  to: string
}

function NavItem({ label, to }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? 'nav-link nav-link--active' : 'nav-link'
      }
    >
      {label}
    </NavLink>
  )
}
