import { useAuth } from './AuthProvider'

export function AuthStatusBanner() {
  const { errorMessage, isConfigured } = useAuth()

  if (!isConfigured) {
    return (
      <p className="error-text">
        Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para habilitar
        registro e inicio de sesión.
      </p>
    )
  }

  if (!errorMessage) {
    return null
  }

  return <p className="error-text">{errorMessage}</p>
}
