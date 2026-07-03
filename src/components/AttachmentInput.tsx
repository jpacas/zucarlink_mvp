import { useEffect, useRef, useState } from 'react'

import { validateMediaFile } from '../lib/media-storage'

interface AttachmentInputProps {
  file: File | null
  onSelect: (file: File | null) => void
  disabled?: boolean
  label?: string
}

export function AttachmentInput({
  file,
  onSelect,
  disabled = false,
  label = 'Adjuntar imagen o video',
}: AttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setPreviewType(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPreviewType(file.type.startsWith('video/') ? 'video' : 'image')

    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    event.target.value = ''

    if (!selected) return

    try {
      validateMediaFile(selected)
      setError(null)
      onSelect(selected)
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : 'No fue posible procesar el archivo.',
      )
    }
  }

  function handleRemove() {
    setError(null)
    onSelect(null)
  }

  return (
    <div className="attachment-input">
      {previewUrl ? (
        <div className="attachment-input__preview">
          {previewType === 'video' ? (
            <video src={previewUrl} controls muted className="attachment-input__media" />
          ) : (
            <img src={previewUrl} alt="Vista previa del adjunto" className="attachment-input__media" />
          )}
          <button
            type="button"
            className="button button--ghost button--sm attachment-input__remove"
            onClick={handleRemove}
            disabled={disabled}
          >
            Quitar adjunto
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button button--ghost button--sm attachment-input__trigger"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          📎 {label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        onChange={handleFileChange}
        disabled={disabled}
      />
      {error ? <p className="error-text attachment-input__error">{error}</p> : null}
    </div>
  )
}
