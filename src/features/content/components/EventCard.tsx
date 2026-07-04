import type { EventItem } from '../types'
import { TagBadge } from './TagBadge'

// Las fechas llegan como 'YYYY-MM-DD' (UTC). Formateamos en UTC para evitar
// que el desfase horario adelante o atrase el día mostrado.
const fullDate = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeZone: 'UTC' })
const monthShort = new Intl.DateTimeFormat('es-SV', { month: 'short', timeZone: 'UTC' })
const monthYear = new Intl.DateTimeFormat('es-SV', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const dayNumber = new Intl.DateTimeFormat('es-SV', { day: 'numeric', timeZone: 'UTC' })

function sameMonth(start: Date, end: Date) {
  return (
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth()
  )
}

function formatFullRange(startDate: string, endDate?: string) {
  const start = new Date(startDate)
  if (!endDate || endDate === startDate) {
    return fullDate.format(start)
  }
  const end = new Date(endDate)
  // Mismo mes: colapsa a "10–14 ago 2026" en vez de repetir mes y año.
  if (sameMonth(start, end)) {
    return `${dayNumber.format(start)}–${dayNumber.format(end)} ${monthYear.format(start)}`
  }
  return `${fullDate.format(start)} – ${fullDate.format(end)}`
}

function buildDateBlock(startDate: string, endDate?: string) {
  const start = new Date(startDate)
  const month = monthShort.format(start).replace('.', '')
  const startDay = dayNumber.format(start)

  if (endDate && endDate !== startDate) {
    const end = new Date(endDate)
    if (sameMonth(start, end)) {
      return { month, day: `${startDay}–${dayNumber.format(end)}` }
    }
  }

  return { month, day: startDay }
}

type TagVariant = 'tecnico' | 'proveedor' | 'info'

// La primera tag del evento indica el tipo y se usa para colorear con los
// complementarios de marca: técnico → verde, feria/proveedores → naranja,
// mercado → cian.
const TAG_VARIANTS: Record<string, TagVariant> = {
  técnico: 'tecnico',
  tecnico: 'tecnico',
  congreso: 'tecnico',
  feria: 'proveedor',
  proveedores: 'proveedor',
  mercado: 'info',
}

function variantForTag(tag: string): TagVariant | undefined {
  return TAG_VARIANTS[tag.toLowerCase()]
}

interface EventCardProps {
  item: EventItem
  featured?: boolean
}

export function EventCard({ item, featured = false }: EventCardProps) {
  const dateBlock = buildDateBlock(item.startDate, item.endDate)
  const location = [item.city, item.country].filter(Boolean).join(', ')

  return (
    <article className={`content-item-card event-card${featured ? ' event-card--featured' : ''}`}>
      <div className="event-card__date" aria-hidden="true">
        <span className="event-card__date-month">{dateBlock.month}</span>
        <span className="event-card__date-day">{dateBlock.day}</span>
      </div>
      <div className="event-card__body stack stack--compact">
        <div className="content-item-card__meta">
          <span>{formatFullRange(item.startDate, item.endDate)}</span>
          {item.organizer ? <span>{item.organizer}</span> : null}
        </div>
        <h3 className="content-item-card__heading">{item.title}</h3>
        {location ? (
          <p className="event-card__location">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1.5c-2.49 0-4.5 2-4.5 4.47C3.5 9.3 8 14.5 8 14.5s4.5-5.2 4.5-8.53C12.5 3.5 10.49 1.5 8 1.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {location}
          </p>
        ) : null}
        <p className="event-card__summary">{item.summary}</p>
        <div className="content-item-card__footer">
          <div className="tag-row">
            {item.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} label={tag} variant={variantForTag(tag)} />
            ))}
          </div>
          {item.sourceUrl ? (
            <a
              className="button button--sm button--secondary"
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver evento
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
