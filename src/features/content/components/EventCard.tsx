import type { EventItem } from '../types'
import { TagBadge } from './TagBadge'

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

interface EventCardProps {
  item: EventItem
}

export function EventCard({ item }: EventCardProps) {
  return (
    <article className="content-item-card stack">
      <div className="content-item-card__meta">
        <span>
          {formatEventDate(item.startDate)}
          {item.endDate ? ` - ${formatEventDate(item.endDate)}` : ''}
        </span>
        {item.organizer ? <span>{item.organizer}</span> : null}
      </div>
      <h3 className="content-item-card__heading">{item.title}</h3>
      <p>{item.summary}</p>
      <div className="content-item-card__footer">
        <div className="stack stack--compact">
          <span>{[item.city, item.country].filter(Boolean).join(', ')}</span>
          <div className="tag-row">
            {item.tags.slice(0, 2).map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </div>
        </div>
        {item.sourceUrl ? (
          <a className="inline-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
            Ver evento
          </a>
        ) : null}
      </div>
    </article>
  )
}
