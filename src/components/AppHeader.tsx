import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { getMyAvatarUrl } from '../features/profile/api'
import { useUnreadCount } from '../features/messages/useUnreadCount'
import { ZucarLogo } from './ZucarLogo'

const publicLinks = [
  { to: '/directory', label: 'Directorio' },
  { to: '/forum', label: 'Foro' },
  { to: '/informacion', label: 'Información' },
  { to: '/proveedores', label: 'Proveedores' },
]

export function AppHeader() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAuthed = Boolean(user)
  const accountType = user?.user_metadata?.account_type
  const isAdmin = Boolean(user?.user_metadata?.is_admin)

  // Elementos propios de la cuenta (varían según el tipo de usuario)
  const accountLinks =
    accountType === 'provider'
      ? [
          { to: '/app', label: 'Panel' },
          { to: '/proveedores/directorio', label: 'Directorio' },
          { to: '/app/provider', label: 'Perfil comercial' },
          { to: '/app/provider/leads', label: 'Solicitudes' },
        ]
      : [
          { to: '/app', label: 'Panel' },
          { to: '/app/directory', label: 'Directorio' },
        ]

  // Servicios públicos de Zucarlink, accesibles también estando logueado
  const serviceLinks = [
    { to: '/forum', label: 'Foro' },
    { to: '/informacion', label: 'Información' },
    { to: '/proveedores', label: 'Proveedores' },
  ]

  // Cuenta + servicios + Mensajes al final (sin duplicar rutas ya presentes)
  const primaryLinks = [
    ...accountLinks,
    ...serviceLinks.filter((s) => !accountLinks.some((a) => a.to === s.to)),
    { to: '/app/messages', label: 'Mensajes' },
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
  const unreadCount = useUnreadCount(isAuthed && accountType !== 'provider')

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null)
      return
    }
    let active = true
    getMyAvatarUrl(user)
      .then((url) => {
        if (active) setAvatarUrl(url)
      })
      .catch(() => {
        if (active) setAvatarUrl(null)
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    setMenuOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  const navLinks = isAuthed ? primaryLinks : publicLinks

  return (
    <header className="app-header">
      {navOpen ? (
        <div className="nav-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />
      ) : null}

      <Link to="/" aria-label="Ir al inicio">
        <ZucarLogo height={36} />
      </Link>

      <div className="app-header__right">
        <button
          type="button"
          className="menu-toggle"
          aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
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

        <nav className={`main-nav${navOpen ? ' main-nav--open' : ''}`} aria-label="Principal">
          {navLinks.map((link) => (
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
              {link.to === '/app/messages' && unreadCount > 0 ? (
                <span className="nav-unread-badge" aria-label={`${unreadCount} no leídos`}>
                  {unreadCount}
                </span>
              ) : null}
            </NavLink>
          ))}

          {!isAuthed ? (
            <>
              <span className="nav-divider" aria-hidden="true" />
              <div className="nav-auth-group">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? 'nav-link nav-link--ghost nav-link--active' : 'nav-link nav-link--ghost'
                  }
                  onClick={() => setNavOpen(false)}
                >
                  Ingresar
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive ? 'nav-link nav-link--cta nav-link--active' : 'nav-link nav-link--cta'
                  }
                  onClick={() => setNavOpen(false)}
                >
                  Registro
                </NavLink>
              </div>
            </>
          ) : null}
        </nav>

        {isAuthed ? (
          <div className="nav-user-menu" ref={menuRef}>
            <button
              type="button"
              className="nav-user-trigger"
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  aria-hidden="true"
                  width={40}
                  height={40}
                  decoding="async"
                />
              ) : (
                initials
              )}
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
        ) : null}
      </div>
    </header>
  )
}
