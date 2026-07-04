import { useMemo, useState } from 'react'

import { FeaturedPriceCard } from './FeaturedPriceCard'
import { listPriceMarketSummaries } from '../api'
import type { PriceSeries } from '../types'
import { useAsyncData } from '../../../lib/useAsyncData'

const PRIMARY_LABEL = 'Azúcar crudo NY No.11'

interface SugarPriceModuleProps {
  series: PriceSeries[]
}

export function SugarPriceModule({ series }: SugarPriceModuleProps) {
  const orderedSeries = useMemo(() => {
    const primary = series.find((item) => item.label === PRIMARY_LABEL)
    const rest = series.filter((item) => item.label !== PRIMARY_LABEL)
    return primary ? [primary, ...rest] : series
  }, [series])

  const [selectedLabel, setSelectedLabel] = useState(orderedSeries[0]?.label)
  const activeSeries =
    orderedSeries.find((item) => item.label === selectedLabel) ?? orderedSeries[0]

  const { data: summaries } = useAsyncData(
    () => (activeSeries ? listPriceMarketSummaries(activeSeries.label) : Promise.resolve([])),
    [activeSeries?.label],
  )

  if (!activeSeries) {
    return null
  }

  return (
    <div className="sugar-price-module stack">
      {orderedSeries.length > 1 ? (
        <div className="price-tabs" role="tablist" aria-label="Serie de precio del azúcar">
          {orderedSeries.map((item) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={item.label === activeSeries.label}
              className={`price-tab ${item.label === activeSeries.label ? 'price-tab--active' : ''}`}
              onClick={() => setSelectedLabel(item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <FeaturedPriceCard
        label={activeSeries.label}
        history={activeSeries.history}
        summaries={summaries ?? []}
      />
    </div>
  )
}
