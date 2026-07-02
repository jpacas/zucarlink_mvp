import { formatDate } from '../../../lib/date'
import { PriceTrendChart } from './PriceTrendChart'
import type { PriceItem } from '../types'

interface FeaturedPriceCardProps {
  label: string
  history: PriceItem[]
}

export function FeaturedPriceCard({ label, history }: FeaturedPriceCardProps) {
  const latest = history[history.length - 1]
  const pointsWithValue = history.filter((item) => typeof item.valueNumeric === 'number')
  const previous = pointsWithValue[pointsWithValue.length - 2]
  const current = pointsWithValue[pointsWithValue.length - 1]

  const delta =
    current && previous && previous.valueNumeric
      ? ((current.valueNumeric! - previous.valueNumeric!) / previous.valueNumeric!) * 100
      : undefined

  return (
    <article className="price-trend-card stack">
      <div className="split-header">
        <div className="stack stack--compact">
          <p className="eyebrow">Precio clave</p>
          <h3 className="content-item-card__heading">{label}</h3>
        </div>
        <div className="stack stack--compact price-trend-card__value-block">
          <strong className="price-item-card__value">
            {latest.value}
            {latest.unit ? ` ${latest.unit}` : ''}
          </strong>
          {delta !== undefined ? (
            <span
              className={`price-trend-card__delta ${
                delta >= 0 ? 'price-trend-card__delta--up' : 'price-trend-card__delta--down'
              }`}
            >
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>
      <div className="content-item-card__meta">
        <span>{formatDate(latest.observedAt)}</span>
        {latest.sourceName ? (
          latest.sourceUrl ? (
            <a href={latest.sourceUrl} target="_blank" rel="noreferrer">
              {latest.sourceName}
            </a>
          ) : (
            <span>{latest.sourceName}</span>
          )
        ) : null}
      </div>
      <PriceTrendChart history={history} unit={latest.unit} />
      {latest.marketSummary ? (
        <div className="price-trend-card__summary">
          <p className="eyebrow">¿Qué lo está moviendo?</p>
          <p>{latest.marketSummary}</p>
          {latest.marketSummarySources?.length ? (
            <ul className="price-trend-card__sources">
              {latest.marketSummarySources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {latest.marketSummaryUpdatedAt ? (
            <p className="helper-text">Actualizado el {formatDate(latest.marketSummaryUpdatedAt)}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
