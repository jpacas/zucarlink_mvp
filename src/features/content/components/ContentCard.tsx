import { Link } from 'react-router-dom'

import type { ContentItem } from '../types'
import { TagBadge } from './TagBadge'

function formatContentDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

interface ContentCardProps {
  item: ContentItem
}

export function ContentCard({ item }: ContentCardProps) {
  return (
    <article className="content-item-card stack">
      <div className="content-item-card__meta">
        <span>{formatContentDate(item.publishedAt)}</span>
        {item.sourceName ? <span>{item.sourceName}</span> : null}
      </div>
      <Link className="content-item-card__title" to={`/informacion/${item.slug}`}>
        {item.title}
      </Link>
      <p>{item.summary}</p>
      <div className="content-item-card__footer">
        <div className="tag-row">
          {item.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
        <Link className="inline-link" to={`/informacion/${item.slug}`}>
          Ver más
        </Link>
      </div>
    </article>
  )
}
