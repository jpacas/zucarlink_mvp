import { useEffect, useState } from 'react'

import { formatBytes } from '../lib/format-bytes'
import { classifyMediaFile } from '../lib/media-storage'

const ICON_BY_TYPE: Record<string, string> = {
  video: '🎬',
  pdf: '📄',
  word: '📝',
  excel: '📊',
}

interface AttachmentPreviewListProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export function AttachmentPreviewList({ files, onChange, disabled = false }: AttachmentPreviewListProps) {
  if (files.length === 0) return null

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="attachment-chip-list">
      {files.map((file, index) => (
        <AttachmentChip
          key={`${file.name}-${file.size}-${index}`}
          file={file}
          disabled={disabled}
          onRemove={() => handleRemove(index)}
        />
      ))}
    </div>
  )
}

function AttachmentChip({
  file,
  disabled,
  onRemove,
}: {
  file: File
  disabled: boolean
  onRemove: () => void
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const type = classifyMediaFile(file)

  useEffect(() => {
    if (type !== 'image') {
      setThumbUrl(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => setThumbUrl(reader.result as string)
    reader.readAsDataURL(file)

    return () => {
      reader.onload = null
    }
  }, [file, type])

  return (
    <div className="attachment-chip">
      {thumbUrl ? (
        <img src={thumbUrl} alt="" className="attachment-chip__thumb" />
      ) : (
        <span className="attachment-chip__icon" aria-hidden="true">
          {ICON_BY_TYPE[type ?? ''] ?? '📎'}
        </span>
      )}
      <span className="attachment-chip__name" title={file.name}>
        {file.name} · {formatBytes(file.size)}
      </span>
      <button
        type="button"
        className="attachment-chip__remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Quitar ${file.name}`}
        title="Quitar"
      >
        ×
      </button>
    </div>
  )
}
