import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthFormShell } from '../features/auth/AuthFormShell'
import { getSupabaseBrowserClient } from '../lib/supabase'

export function PasswordResetPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Supabase processes the recovery token from the URL hash automatically.
  // We listen for the PASSWORD_RECOVERY event to confirm the session is valid.
  useEffect(() => {
    const client = getSupabaseBrowserClient()

    if (!client) {
      setErrorMessage('El servicio de autenticación no está disponible.')
      return
    }

    // Check if session already active (e.g. page refreshed after token processing)
    void client.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsReady(true)
      }
    })

    const { data: subscription } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true)
      }
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const client = getSupabaseBrowserClient()

    if (!client) {
      setErrorMessage('El servicio de autenticación no está disponible.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const { error } = await client.auth.updateUser({ password })

      if (error) {
        throw new Error(error.message)
      }

      setSuccess(true)

      // Sign out so the user logs in fresh with the new password
      await client.auth.signOut()

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible actualizar la contraseña.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <AuthFormShell
        eyebrow="Contraseña actualizada"
        title="¡Listo!"
        description="Tu contraseña fue cambiada correctamente. Te redirigiremos al inicio de sesión."
      >
        <div className="actions">
          <Link className="button" to="/login">
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthFormShell>
    )
  }

  if (!isReady) {
    return (
      <AuthFormShell
        eyebrow="Recuperar contraseña"
        title="Validando enlace"
        description="Estamos verificando tu enlace de recuperación..."
      >
        {errorMessage ? (
          <div className="stack">
            <p className="error-text">{errorMessage}</p>
            <Link className="button button--secondary" to="/recuperar-contrasena">
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : null}
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell
      eyebrow="Recuperar contraseña"
      title="Crear nueva contraseña"
      description="Elige una contraseña segura para tu cuenta de Zucarlink."
    >
      <form className="stack" onSubmit={handleSubmit}>
        {errorMessage ? (
          <p className="error-text">{errorMessage}</p>
        ) : null}

        <div className="field">
          <label htmlFor="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="field">
          <label htmlFor="confirm-password">Confirmar contraseña</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="actions">
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </div>
      </form>
    </AuthFormShell>
  )
}
