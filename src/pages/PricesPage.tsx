import { useMemo } from 'react'

import { PriceCard } from '../features/content/components/PriceCard'
import { SugarPriceModule } from '../features/content/components/SugarPriceModule'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { groupPriceSeries, listPublishedPrices } from '../features/content/api'
import type { PriceItem } from '../features/content/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { usePageMetadata } from '../lib/usePageMetadata'
import { useAsyncData } from '../lib/useAsyncData'

export function PricesPage() {
  const {
    data,
    isLoading,
    error: errorMessage,
  } = useAsyncData<PriceItem[]>(() => listPublishedPrices(), [])
  const items = useMemo(() => data ?? [], [data])

  usePageMetadata({
    title: 'Precios e indicadores',
    description:
      'Cierre diario del mercado azucarero actualizado automáticamente (dato retrasado, no cotización en tiempo real).',
  })

  const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)
  const { featured, others } = useMemo(() => groupPriceSeries(items), [items])

  return (
    <section className="content-card stack">
      <SectionHeader
        as="h1"
        eyebrow="Mercado"
        title="Precios e indicadores"
        description="Cierre diario del mercado actualizado automáticamente (dato retrasado, no cotización en tiempo real)."
      />
      {isLoading ? (
        <p className="helper-text">Cargando indicadores.</p>
      ) : isPublicDataUnavailable ? (
        <p className="helper-text">Los indicadores se actualizarán pronto.</p>
      ) : errorMessage ? (
        <p className="error-text">{errorMessage}</p>
      ) : items.length > 0 ? (
        <>
          {featured.length > 0 ? (
            <div className="stack">
              <SectionHeader eyebrow="Mercado" title="Precios clave" />
              <SugarPriceModule series={featured} />
            </div>
          ) : null}
          {others.length > 0 ? (
            <div className="stack">
              {featured.length > 0 ? <SectionHeader eyebrow="Mercado" title="Otros indicadores" /> : null}
              <div className="content-card-grid">
                {others.map((item) => (
                  <PriceCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="helper-text">Todavía no hay indicadores visibles.</p>
      )}
    </section>
  )
}
