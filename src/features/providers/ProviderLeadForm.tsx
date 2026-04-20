import { useState } from 'react'

import { createProviderLead } from './api'

interface ProviderLeadFormProps {
  providerId: string
  onSubmitted?: () => void
}

type FeedbackState =
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string }
  | null

export function ProviderLeadForm({ providerId, onSubmitted }: ProviderLeadFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFeedback({ kind: 'error', message: 'Completa nombre, email y mensaje.' })
      return
    }

    if (website.trim()) {
      setFeedback({ kind: 'error', message: 'No fue posible validar tu solicitud.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await createProviderLead({
        providerId,
        name,
        email,
        company,
        message,
      })
      setFeedback({ kind: 'success', message: 'Tu solicitud fue enviada al proveedor.' })
      setName('')
      setEmail('')
      setCompany('')
      setMessage('')
      onSubmitted?.()
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible enviar la solicitud.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="provider-lead-name">Nombre</label>
        <input
          id="provider-lead-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="provider-lead-email">Email</label>
        <input
          id="provider-lead-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="provider-lead-company">Empresa</label>
        <input
          id="provider-lead-company"
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="provider-lead-message">Mensaje</label>
        <textarea
          id="provider-lead-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          required
        />
      </div>
      <div className="field sr-only" aria-hidden="true">
        <label htmlFor="provider-lead-company-website">Website</label>
        <input
          id="provider-lead-company-website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          type="text"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {feedback ? (
        <p className={feedback.kind === 'error' ? 'error-text' : 'status'}>
          {feedback.message}
        </p>
      ) : null}
      <div className="actions">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  )
}
