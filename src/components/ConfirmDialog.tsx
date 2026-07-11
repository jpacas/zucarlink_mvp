import { useEffect } from 'react'

interface ConfirmDialogProps {
  titleId: string
  title: string
  description: string
  errorMessage?: string | null
  isBusy?: boolean
  confirmLabel?: string
  busyLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  titleId,
  title,
  description,
  errorMessage,
  isBusy = false,
  confirmLabel = 'Borrar',
  busyLabel = 'Borrando...',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isBusy) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isBusy, onCancel])

  return (
    <div
      className="confirm-overlay"
      role="presentation"
      onClick={() => {
        if (!isBusy) onCancel()
      }}
    >
      <div
        className="confirm-card stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{title}</h3>
        <p className="helper-text">{description}</p>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        <div className="confirm-card__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
