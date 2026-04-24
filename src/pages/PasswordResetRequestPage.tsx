import { useState } from 'react'
import { Link } from 'react-router-dom'

import { AuthFormShell } from '../features/auth/AuthFormShell'
import { getSupabaseBrowserClient } from '../lib/supabase'

export function PasswordResetRequestPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const client = getSupabaseBrowserClient()

    if (!client) {
      setErrorMessage('El servicio de autenticación no está disponible en este momento.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/nueva-contrasena`,
      })

      if (error) {
        throw new Error(error.message)
      }

      setSent(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible enviar el correo. Intenta de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthFormShell
        eyebrow="Recuperar contraseña"
        title="Revisa tu correo"
        description="Te enviamos un enlace para restablecer tu contraseña. Puede tardar unos minutos en llegar."
      >
        <div className="stack">
          <p className="helper-text">
            Si el correo <strong>{email}</strong> está registrado en Zucarlink, recibirás un
            enlace en los próximos minutos. Revisa también la carpeta de spam.
          </p>
          <div className="actions">
            <Link className="button" to="/login">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell
      eyebrow="Recuperar contraseña"
      title="¿Olvidaste tu contraseña?"
      description="Escribe tu correo y te enviaremos un enlace para crear una nueva."
    >
      <form className="stack" onSubmit={handleSubmit}>
        {errorMessage ? (
          <p className="error-text">{errorMessage}</p>
        ) : null}

        <div className="field">
          <label htmlFor="reset-email">Correo electrónico</label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="actions">
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <span className="helper-text">
            <Link to="/login">Volver al inicio de sesión</Link>
          </span>
        </div>
      </form>
    </AuthFormShell>
  )
}
