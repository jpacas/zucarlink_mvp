import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { SiteFooter } from '../components/SiteFooter'
import { ZucarLogo } from '../components/ZucarLogo'

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
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <header className="app-header">
        <div>
          <ZucarLogo height={36} />
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="public-navigation"
          aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
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
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
      <SiteFooter />
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
