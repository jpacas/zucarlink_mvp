import { useRef, useState } from 'react'

import { MAX_ATTACHMENTS_PER_MESSAGE } from '../types/storage'
import { validateMediaFile } from '../lib/media-storage'

interface AttachmentInputProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  label?: string
  variant?: 'icon' | 'button'
}

const ACCEPT =
  'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,' +
  'application/pdf,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function AttachmentInput({
  files,
  onChange,
  disabled = false,
  label = 'Adjuntar',
  variant = 'button',
}: AttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const atLimit = files.length >= MAX_ATTACHMENTS_PER_MESSAGE

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (selected.length === 0) return

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of selected) {
      try {
        validateMediaFile(file)
        validFiles.push(file)
      } catch (validationError) {
        errors.push(
          validationError instanceof Error
            ? `${file.name}: ${validationError.message}`
            : `${file.name}: no fue posible procesar el archivo.`,
        )
      }
    }

    const availableSlots = MAX_ATTACHMENTS_PER_MESSAGE - files.length
    const accepted = validFiles.slice(0, Math.max(availableSlots, 0))
    const omittedCount = validFiles.length - accepted.length

    if (omittedCount > 0) {
      errors.push(`Máximo ${MAX_ATTACHMENTS_PER_MESSAGE} archivos, se omitieron ${omittedCount}.`)
    }

    setError(errors.length > 0 ? errors.join(' ') : null)

    if (accepted.length > 0) {
      onChange([...files, ...accepted])
    }
  }

  return (
    <div className={`attachment-input attachment-input--${variant}`}>
      {variant === 'icon' ? (
        <button
          type="button"
          className="messages-composer__attach-trigger"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || atLimit}
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
        >
          📎
        </button>
      ) : (
        <button
          type="button"
          className="button button--ghost button--sm attachment-input__trigger"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || atLimit}
        >
          📎 {label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        accept={ACCEPT}
        onChange={handleFileChange}
        disabled={disabled || atLimit}
      />
      {error ? <p className="error-text attachment-input__error">{error}</p> : null}
    </div>
  )
}
