import { useAuth } from './AuthProvider'

export function AuthStatusBanner() {
  const { errorMessage, isConfigured } = useAuth()

  if (!isConfigured) {
    return <p className="helper-text">El acceso estará disponible pronto.</p>
  }

  if (!errorMessage) {
    return null
  }

  return <p className="error-text">{errorMessage}</p>
}
