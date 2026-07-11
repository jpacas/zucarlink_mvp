interface UploadProgressBarProps {
  label?: string
}

export function UploadProgressBar({ label = 'Subiendo…' }: UploadProgressBarProps) {
  return (
    <div className="upload-progress" role="status" aria-live="polite">
      <span className="upload-progress__bar" />
      <span className="upload-progress__label">{label}</span>
    </div>
  )
}
