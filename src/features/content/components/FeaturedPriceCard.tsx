import { useMemo, useState } from 'react'

import { formatDate } from '../../../lib/date'
import { getPriceExplainer } from '../priceExplainers'
import { PriceTrendChart } from './PriceTrendChart'
import type { PriceItem, PriceMarketSummary } from '../types'

const RANGE_OPTIONS = [
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 91 },
  { key: '6M', label: '6M', days: 182 },
  { key: '1A', label: '1A', days: 365 },
  { key: '5A', label: '5A', days: 1826 },
  { key: 'todo', label: 'Todo', days: undefined },
] as const

type RangeKey = (typeof RANGE_OPTIONS)[number]['key']

const HISTORY_TABLE_ROWS = 15

const numberFormatter = new Intl.NumberFormat('es-SV', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function rangeCutoff(anchor: string, days: number): string {
  const date = new Date(`${anchor}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

interface FeaturedPriceCardProps {
  label: string
  history: PriceItem[]
  summaries: PriceMarketSummary[]
}

export function FeaturedPriceCard({ label, history, summaries }: FeaturedPriceCardProps) {
  const latest = history[history.length - 1]
  const pointsWithValue = useMemo(
    () => history.filter((item) => typeof item.valueNumeric === 'number'),
    [history],
  )
  const previous = pointsWithValue[pointsWithValue.length - 2]
  const current = pointsWithValue[pointsWithValue.length - 1]

  const delta =
    current && previous && previous.valueNumeric
      ? ((current.valueNumeric! - previous.valueNumeric!) / previous.valueNumeric!) * 100
      : undefined

  // Solo se ofrecen rangos que realmente recortan la serie; "Todo" siempre.
  const availableRanges = useMemo(() => {
    const anchor = pointsWithValue[pointsWithValue.length - 1]?.observedAt
    const oldest = pointsWithValue[0]?.observedAt
    if (!anchor || !oldest) {
      return RANGE_OPTIONS.filter((option) => option.key === 'todo')
    }
    return RANGE_OPTIONS.filter(
      (option) => option.days === undefined || rangeCutoff(anchor, option.days) > oldest,
    )
  }, [pointsWithValue])

  const [selectedRange, setSelectedRange] = useState<RangeKey>(() =>
    availableRanges.some((option) => option.key === '3M') ? '3M' : 'todo',
  )
  const activeRange =
    availableRanges.find((option) => option.key === selectedRange) ??
    availableRanges[availableRanges.length - 1]

  const rangePoints = useMemo(() => {
    if (!activeRange || activeRange.days === undefined) {
      return pointsWithValue
    }
    const anchor = pointsWithValue[pointsWithValue.length - 1]?.observedAt
    if (!anchor) {
      return pointsWithValue
    }
    const cutoff = rangeCutoff(anchor, activeRange.days)
    return pointsWithValue.filter((item) => item.observedAt >= cutoff)
  }, [pointsWithValue, activeRange])

  const rangeStats = useMemo(() => {
    if (rangePoints.length < 2) {
      return undefined
    }
    const values = rangePoints.map((item) => item.valueNumeric!)
    const first = values[0]
    const last = values[values.length - 1]
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, value) => sum + value, 0) / values.length,
      change: first ? ((last - first) / first) * 100 : undefined,
    }
  }, [rangePoints])

  const tableRows = useMemo(() => {
    return rangePoints
      .map((item, index) => {
        const prior = index > 0 ? rangePoints[index - 1] : undefined
        const dayChange =
          prior && prior.valueNumeric
            ? ((item.valueNumeric! - prior.valueNumeric!) / prior.valueNumeric!) * 100
            : undefined
        return { item, dayChange }
      })
      .slice(-HISTORY_TABLE_ROWS)
      .reverse()
  }, [rangePoints])

  const explainer = getPriceExplainer(label)

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
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs. cierre anterior
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
      {availableRanges.length > 1 ? (
        <div className="price-range-tabs" role="tablist" aria-label="Rango del histórico">
          {availableRanges.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={option.key === activeRange?.key}
              className={`price-range-tab ${
                option.key === activeRange?.key ? 'price-range-tab--active' : ''
              }`}
              onClick={() => setSelectedRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      <PriceTrendChart history={rangePoints} unit={latest.unit} />
      {rangeStats ? (
        <dl className="price-stats">
          <div className="price-stat">
            <dt>Mínimo del rango</dt>
            <dd>{numberFormatter.format(rangeStats.min)}</dd>
          </div>
          <div className="price-stat">
            <dt>Máximo del rango</dt>
            <dd>{numberFormatter.format(rangeStats.max)}</dd>
          </div>
          <div className="price-stat">
            <dt>Promedio del rango</dt>
            <dd>{numberFormatter.format(rangeStats.avg)}</dd>
          </div>
          <div className="price-stat">
            <dt>Variación en el rango</dt>
            <dd
              className={
                rangeStats.change !== undefined
                  ? rangeStats.change >= 0
                    ? 'price-trend-card__delta--up'
                    : 'price-trend-card__delta--down'
                  : undefined
              }
            >
              {rangeStats.change !== undefined
                ? `${rangeStats.change >= 0 ? '+' : '−'}${Math.abs(rangeStats.change).toFixed(2)}%`
                : '—'}
            </dd>
          </div>
        </dl>
      ) : null}
      {tableRows.length > 1 ? (
        <details className="price-history">
          <summary>Ver últimos cierres</summary>
          <div className="price-history__scroll">
            <table className="price-history__table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cierre{latest.unit ? ` (${latest.unit})` : ''}</th>
                  <th scope="col">Var. diaria</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ item, dayChange }) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.observedAt)}</td>
                    <td>{numberFormatter.format(item.valueNumeric!)}</td>
                    <td
                      className={
                        dayChange !== undefined
                          ? dayChange >= 0
                            ? 'price-trend-card__delta--up'
                            : 'price-trend-card__delta--down'
                          : undefined
                      }
                    >
                      {dayChange !== undefined
                        ? `${dayChange >= 0 ? '+' : '−'}${Math.abs(dayChange).toFixed(2)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      {explainer ? (
        <div className="price-explainer stack stack--compact">
          <p className="eyebrow">{explainer.title}</p>
          {explainer.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
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
