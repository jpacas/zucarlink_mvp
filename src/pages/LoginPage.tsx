import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthFormShell } from '../features/auth/AuthFormShell'
import { useAuth } from '../features/auth/AuthProvider'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isConfigured) {
      return
    }

    setIsSubmitting(true)

    try {
      await signIn({ email, password })
      navigate(nextPath ?? '/app', { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormShell
      eyebrow="Acceso"
      title="Iniciar sesión"
      description="Ingresa con tu correo y contraseña para acceder a las rutas privadas."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={isSubmitting || !isConfigured}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
          <span className="helper-text">
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </span>
        </div>
      </form>
    </AuthFormShell>
  )
}
