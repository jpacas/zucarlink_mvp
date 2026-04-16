import type { PriceItem } from '../types'

function formatObservedDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

interface PriceCardProps {
  item: PriceItem
}

export function PriceCard({ item }: PriceCardProps) {
  return (
    <article className="price-item-card stack">
      <div className="split-header">
        <div className="stack stack--compact">
          <p className="eyebrow">Indicador</p>
          <h3 className="content-item-card__heading">{item.label}</h3>
        </div>
        <strong className="price-item-card__value">
          {item.value}
          {item.unit ? ` ${item.unit}` : ''}
        </strong>
      </div>
      <div className="content-item-card__meta">
        <span>{formatObservedDate(item.observedAt)}</span>
        {item.sourceName ? (
          item.sourceUrl ? (
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">
              {item.sourceName}
            </a>
          ) : (
            <span>{item.sourceName}</span>
          )
        ) : null}
      </div>
      {item.notes ? <p>{item.notes}</p> : null}
    </article>
  )
}
