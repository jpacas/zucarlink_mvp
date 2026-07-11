import { useEffect, type PropsWithChildren } from 'react'

import { AuthStatusBanner } from './AuthStatusBanner'
import { useAuth } from './AuthProvider'

interface AuthFormShellProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
}

export function AuthFormShell({
  eyebrow,
  title,
  description,
  children,
}: AuthFormShellProps) {
  const { clearError } = useAuth()

  // Evita que un error de auth de la página anterior (p. ej. login fallido)
  // quede visible al navegar a otra pantalla de auth (p. ej. recuperar contraseña).
  useEffect(() => {
    clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="auth-card stack">
      <div className="stack">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <AuthStatusBanner />
      {children}
    </section>
  )
}
