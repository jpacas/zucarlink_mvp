import { formatBytes } from '../lib/format-bytes'

interface AttachmentViewProps {
  url: string
  type: 'image' | 'video'
  filename?: string | null
  sizeBytes?: number | null
  alt?: string
}

export function AttachmentView({ url, type, filename, sizeBytes, alt = 'Adjunto' }: AttachmentViewProps) {
  if (!url) return null

  return (
    <div className="attachment-view">
      {filename || sizeBytes ? (
        <p className="attachment-view__meta">
          {filename ?? (type === 'video' ? 'Video adjunto' : 'Imagen adjunta')}
          {sizeBytes ? <span className="attachment-view__size"> · {formatBytes(sizeBytes)}</span> : null}
        </p>
      ) : null}
      {type === 'video' ? (
        <video src={url} controls playsInline preload="metadata" className="attachment-view__media" />
      ) : (
        <img src={url} alt={alt} loading="lazy" className="attachment-view__media" />
      )}
    </div>
  )
}
