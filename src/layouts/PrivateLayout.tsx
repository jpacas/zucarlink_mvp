import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { useUnreadCount } from '../features/messages/useUnreadCount'
import { SiteFooter } from '../components/SiteFooter'
import { ZucarLogo } from '../components/ZucarLogo'

export function PrivateLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const accountType = user?.user_metadata?.account_type
  const isAdmin = Boolean(user?.user_metadata?.is_admin)

  const primaryLinks =
    accountType === 'provider'
      ? [
          { to: '/app', label: 'Panel', external: false },
          { to: '/proveedores/directorio', label: 'Directorio', external: true },
          { to: '/app/provider', label: 'Perfil comercial', external: false },
          { to: '/app/messages', label: 'Mensajes', external: false },
        ]
      : [
          { to: '/app', label: 'Panel', external: false },
          { to: '/app/directory', label: 'Directorio', external: false },
          { to: '/forum', label: 'Foro', external: true },
          { to: '/app/messages', label: 'Mensajes', external: false },
        ]

  const userMenuLinks =
    accountType === 'provider'
      ? [
          { to: '/app/provider/edit', label: 'Editar perfil' },
          { to: '/app/settings', label: 'Ajustes' },
        ]
      : [
          { to: '/app/profile', label: 'Mi perfil' },
          { to: '/app/settings', label: 'Ajustes' },
          ...(isAdmin
            ? [
                { to: '/app/admin/dashboard', label: 'Dashboard' },
                { to: '/app/providers-admin', label: 'Admin proveedores' },
              ]
            : []),
        ]

  const initials = (user?.email ?? '?')[0].toUpperCase()
  const unreadCount = useUnreadCount(accountType !== 'provider')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleLogout() {
    setMenuOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <header className="app-header">
        <Link to="/" aria-label="Ir al inicio">
          <ZucarLogo height={36} />
        </Link>

        <div className="app-header__right">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menú"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {navOpen ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              )}
            </svg>
          </button>

          <nav className={`main-nav${navOpen ? ' main-nav--open' : ''}`} aria-label="Privada">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/app'}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link--active' : 'nav-link'
                }
                onClick={() => setNavOpen(false)}
              >
                {link.label}
                {link.external ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                    style={{ marginLeft: 4, opacity: 0.55, flexShrink: 0 }}
                  >
                    <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : null}
                {link.to === '/app/messages' && unreadCount > 0 ? (
                  <span className="nav-unread-badge" aria-label={`${unreadCount} no leídos`}>
                    {unreadCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="nav-user-menu" ref={menuRef}>
            <button
              type="button"
              className="nav-user-trigger"
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="nav-user-dropdown" role="menu">
                <p className="nav-user-dropdown__email">{user?.email}</p>
                <div className="nav-user-dropdown__divider" />
                {userMenuLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="nav-user-dropdown__link"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="nav-user-dropdown__divider" />
                <button
                  type="button"
                  className="nav-user-dropdown__link nav-user-dropdown__link--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
