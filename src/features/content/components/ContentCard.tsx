import { Link } from 'react-router-dom'

import type { ContentItem } from '../types'
import { TagBadge } from './TagBadge'

function formatContentDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value))
}

type CategoryAccent = 'brand' | 'tecnico' | 'proveedor' | 'info'

// Mapea cada categoría editorial a un color de marca para dar ritmo visual a la
// grilla sin inventar colores nuevos (reutiliza los complementarios).
const CATEGORY_ACCENT: Record<string, CategoryAccent> = {
  Mercado: 'info',
  Regulación: 'info',
  Agrícola: 'tecnico',
  Producción: 'tecnico',
  Sostenibilidad: 'tecnico',
  Mantenimiento: 'proveedor',
  Eventos: 'proveedor',
  Energía: 'brand',
  Automatización: 'brand',
  Innovación: 'brand',
  Tecnología: 'brand',
}

function categoryAccent(category: string): CategoryAccent {
  return CATEGORY_ACCENT[category] ?? 'brand'
}

interface ContentCardProps {
  item: ContentItem
}

export function ContentCard({ item }: ContentCardProps) {
  return (
    <article className="content-item-card content-news-card content-card--link">
      <span className={`content-news-card__category content-news-card__category--${categoryAccent(item.category)}`}>
        {item.category}
      </span>
      <Link className="content-item-card__title" to={`/informacion/${item.slug}`}>
        {item.title}
      </Link>
      <p className="content-news-card__summary">{item.summary}</p>
      <div className="content-item-card__meta content-news-card__meta">
        <span>{formatContentDate(item.publishedAt)}</span>
        {item.sourceName ? <span>{item.sourceName}</span> : null}
      </div>
      <div className="content-item-card__footer content-news-card__footer">
        <div className="tag-row">
          {item.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
        <span className="content-news-card__more" aria-hidden="true">
          Leer →
        </span>
      </div>
    </article>
  )
}
