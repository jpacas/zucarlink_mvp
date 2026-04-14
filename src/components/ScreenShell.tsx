import type { ReactNode } from 'react'

interface ScreenShellProps {
  audience: 'Público' | 'Privado'
  children?: ReactNode
  description: string
  highlights?: string[]
  route: string
  title: string
}

export function ScreenShell({
  audience,
  children,
  description,
  highlights,
  route,
  title,
}: ScreenShellProps) {
  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">{audience}</p>
          <h2>{title}</h2>
        </div>
        <span className="route-chip">{route}</span>
      </div>
      <p>{description}</p>
      {highlights && highlights.length > 0 ? (
        <ul className="list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  )
}
