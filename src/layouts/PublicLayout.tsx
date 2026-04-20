import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'

const publicLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/directory', label: 'Directorio' },
  { to: '/forum', label: 'Foro' },
  { to: '/informacion', label: 'Información' },
  { to: '/proveedores', label: 'Proveedores' },
]

export function PublicLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Zucarlink</p>
          <h1>Zucarlink</h1>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="public-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        </button>
        <nav
          id="public-navigation"
          className={isMenuOpen ? 'main-nav main-nav--open' : 'main-nav'}
          aria-label="Principal"
        >
          {publicLinks.map((link) => (
            <NavItem key={link.to} to={link.to} label={link.label} />
          ))}
          {user ? (
            <NavItem to="/app" label="Mi cuenta" />
          ) : (
            <>
              <NavItem to="/login" label="Ingresar" />
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
