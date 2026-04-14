import { useAuth } from '../features/auth/AuthProvider'

export function AppHomePage() {
  const { user } = useAuth()
  const fullName = user?.user_metadata?.full_name as string | undefined
  const accountType = user?.user_metadata?.account_type as string | undefined

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Panel privado</p>
          <h2>Sesión activa y rutas protegidas</h2>
        </div>
        <span className="user-badge">{accountType ?? 'sin tipo'}</span>
      </div>
      <p>
        Usuario autenticado: <strong>{fullName ?? user?.email}</strong>
      </p>
      <ul className="list">
        <li>La sesión se restaura al recargar mediante Supabase Auth.</li>
        <li>Las rutas bajo `/app` requieren autenticación.</li>
        <li>El tipo de cuenta se guarda en `user_metadata`.</li>
      </ul>
    </section>
  )
}
