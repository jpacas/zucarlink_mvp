import { formatDate } from '../../../lib/date'
import { PriceTrendChart } from './PriceTrendChart'
import type { PriceItem, PriceMarketSummary } from '../types'

interface FeaturedPriceCardProps {
  label: string
  history: PriceItem[]
  summaries: PriceMarketSummary[]
}

export function FeaturedPriceCard({ label, history, summaries }: FeaturedPriceCardProps) {
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
      <div className="price-insight-feed stack stack--compact">
        <p className="eyebrow">¿Qué ha estado moviendo el precio?</p>
        {summaries.length > 0 ? (
          <ul className="price-insight-list">
            {summaries.map((entry) => (
              <li key={entry.id} className="price-insight-item">
                <p className="price-insight-item__period">
                  Semana del {formatDate(entry.periodStart)} al {formatDate(entry.periodEnd)}
                </p>
                <p>{entry.summary}</p>
                {entry.sources.length ? (
                  <ul className="price-trend-card__sources">
                    {entry.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="helper-text">Todavía no hay resúmenes semanales para este indicador.</p>
        )}
      </div>
    </article>
  )
}
