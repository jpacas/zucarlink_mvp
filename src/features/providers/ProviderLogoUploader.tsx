import { useRef, useState } from 'react'

import { ProviderLogo } from './ProviderLogo'

interface ProviderLogoUploaderProps {
  companyName: string
  currentLogoUrl: string | null
  isSubmitting: boolean
  onUpload: (file: File) => Promise<void>
}

export function ProviderLogoUploader({
  companyName,
  currentLogoUrl,
  isSubmitting,
  onUpload,
}: ProviderLogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFeedback(null)

    try {
      await onUpload(file)
      setFeedback('Logo actualizado.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible subir el logo.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="avatar-card">
      <ProviderLogo companyName={companyName} logoUrl={currentLogoUrl} />
      <div className="stack">
        <div>
          <h3>Logo de la empresa</h3>
          <p className="helper-text">
            Aparece en el directorio y tu ficha pública. Formatos: JPEG, PNG o WEBP (máx. 2 MB).
          </p>
        </div>
        <div className="actions">
          <button
            className="button button--ghost"
            type="button"
            disabled={isSubmitting}
            onClick={() => inputRef.current?.click()}
          >
            {isSubmitting ? 'Subiendo...' : 'Subir logo'}
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          {feedback ? <span className="helper-text">{feedback}</span> : null}
        </div>
      </div>
    </div>
  )
}
