import { ScreenShell } from '../components/ScreenShell'
import { useAuth } from '../features/auth/AuthProvider'

export function AppHomePage() {
  const { user } = useAuth()
  const fullName = user?.user_metadata?.full_name as string | undefined
  const accountType = user?.user_metadata?.account_type as string | undefined

  return (
    <ScreenShell
      audience="Privado"
      route="/app"
      title="Panel privado"
      description="Entrada principal del área autenticada. Desde aquí se confirma el acceso protegido y se enlazan los módulos internos."
      highlights={[
        'La sesión se restaura al recargar mediante Supabase Auth.',
        'Las rutas bajo `/app` requieren autenticación.',
        'El tipo de cuenta se guarda en `user_metadata`.',
      ]}
    >
      <div className="split-header">
        <span className="user-badge">{accountType ?? 'sin tipo'}</span>
      </div>
      <p>
        Usuario autenticado: <strong>{fullName ?? user?.email}</strong>
      </p>
    </ScreenShell>
  )
}
