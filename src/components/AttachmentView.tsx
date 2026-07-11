import { formatBytes } from '../lib/format-bytes'

export type AttachmentViewType = 'image' | 'video' | 'pdf' | 'word' | 'excel'

interface AttachmentViewItem {
  url: string
  type: AttachmentViewType
  filename?: string | null
  sizeBytes?: number | null
}

const DOC_ICON_BY_TYPE: Record<string, string> = {
  pdf: '📄',
  word: '📝',
  excel: '📊',
}

const DOC_LABEL_BY_TYPE: Record<string, string> = {
  pdf: 'Documento PDF',
  word: 'Documento Word',
  excel: 'Documento Excel',
}

interface AttachmentViewProps {
  attachments: AttachmentViewItem[]
}

export function AttachmentView({ attachments }: AttachmentViewProps) {
  const items = attachments.filter((item) => item.url)
  if (items.length === 0) return null

  return (
    <div className="attachment-view-list">
      {items.map((item, index) => (
        <div className="attachment-view" key={`${item.url}-${index}`}>
          {item.filename || item.sizeBytes ? (
            <p className="attachment-view__meta">
              {item.filename ?? (item.type === 'video' ? 'Video adjunto' : 'Imagen adjunta')}
              {item.sizeBytes ? <span className="attachment-view__size"> · {formatBytes(item.sizeBytes)}</span> : null}
            </p>
          ) : null}
          {item.type === 'video' ? (
            <video src={item.url} controls playsInline preload="metadata" className="attachment-view__media" />
          ) : item.type === 'image' ? (
            <img src={item.url} alt="Adjunto" loading="lazy" className="attachment-view__media" />
          ) : (
            <a
              href={item.url}
              download={item.filename ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="attachment-view__doc"
            >
              <span className="attachment-view__doc-icon" aria-hidden="true">
                {DOC_ICON_BY_TYPE[item.type] ?? '📎'}
              </span>
              <span className="attachment-view__doc-name">
                {item.filename ?? DOC_LABEL_BY_TYPE[item.type] ?? 'Documento'}
              </span>
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
