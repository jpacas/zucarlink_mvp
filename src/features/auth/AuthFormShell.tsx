import type { PropsWithChildren } from 'react'

import { AuthStatusBanner } from './AuthStatusBanner'

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
