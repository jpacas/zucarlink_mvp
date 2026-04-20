import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthFormShell } from '../features/auth/AuthFormShell'
import { useAuth } from '../features/auth/AuthProvider'
import { resolvePostAuthDestination } from '../features/profile/api'
import type { AccountType } from '../types/auth'

type FeedbackState = {
  kind: 'error' | 'success'
  message: string
} | null

export function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('technician')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signUp, isConfigured } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isConfigured) {
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await signUp({ accountType, fullName, email, password })

      if (result.needsEmailConfirmation) {
        setFeedback({
          kind: 'success',
          message: 'Cuenta creada. Revisa tu correo para confirmar tu email antes de iniciar sesión.',
        })
        return
      }

      if (!result.user) {
        throw new Error('No fue posible recuperar el usuario recién creado.')
      }

      const destination = await resolvePostAuthDestination(result.user)
      navigate(destination, { replace: true })
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible crear la cuenta.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormShell
      eyebrow="Registro"
      title="Crear cuenta"
      description="Solicitamos solo el mínimo necesario para arrancar: tipo de cuenta, nombre completo, email y contraseña."
    >
      <form className="stack" onSubmit={handleSubmit}>
        <fieldset className="field">
          <legend className="legend">Tipo de cuenta</legend>
          <div className="radio-group">
            <label className="radio-option" htmlFor="type-technician">
              <input
                id="type-technician"
                name="accountType"
                type="radio"
                checked={accountType === 'technician'}
                onChange={() => setAccountType('technician')}
              />
              Técnico
            </label>
            <label className="radio-option" htmlFor="type-provider">
              <input
                id="type-provider"
                name="accountType"
                type="radio"
                checked={accountType === 'provider'}
                onChange={() => setAccountType('provider')}
              />
              Proveedor
            </label>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="register-name">Nombre completo</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>
        {feedback ? (
          <p className={feedback.kind === 'error' ? 'error-text' : 'status'}>{feedback.message}</p>
        ) : null}
        <div className="actions">
          <button className="button" type="submit" disabled={isSubmitting || !isConfigured}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <span className="helper-text">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </span>
        </div>
      </form>
    </AuthFormShell>
  )
}
