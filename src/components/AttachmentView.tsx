interface AttachmentViewProps {
  url: string
  type: 'image' | 'video'
  alt?: string
}

export function AttachmentView({ url, type, alt = 'Adjunto' }: AttachmentViewProps) {
  if (!url) return null

  return (
    <div className="attachment-view">
      {type === 'video' ? (
        <video src={url} controls playsInline preload="metadata" className="attachment-view__media" />
      ) : (
        <img src={url} alt={alt} loading="lazy" className="attachment-view__media" />
      )}
    </div>
  )
}
