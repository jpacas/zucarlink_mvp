import { useState } from 'react'

import { createProviderLead } from './api'

interface ProviderLeadFormProps {
  providerId: string
  onSubmitted?: () => void
}

export function ProviderLeadForm({ providerId, onSubmitted }: ProviderLeadFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFeedback('Completa nombre, email y mensaje.')
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
      setFeedback('Tu solicitud fue enviada al proveedor.')
      setName('')
      setEmail('')
      setCompany('')
      setMessage('')
      onSubmitted?.()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible enviar la solicitud.')
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
      {feedback ? <p className="status">{feedback}</p> : null}
      <div className="actions">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  )
}
