import { useEffect, useState } from 'react'

import { PriceCard } from '../features/content/components/PriceCard'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listPublishedPrices } from '../features/content/api'
import type { PriceItem } from '../features/content/types'
import { usePageMetadata } from '../lib/usePageMetadata'

export function PricesPage() {
  const [items, setItems] = useState<PriceItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  usePageMetadata({
    title: 'Precios e indicadores',
    description:
      'Indicadores curados para lectura rápida del entorno azucarero. Este bloque no es un feed en tiempo real.',
  })

  useEffect(() => {
    let isMounted = true

    void listPublishedPrices()
      .then((nextItems) => {
        if (isMounted) {
          setItems(nextItems)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setItems([])
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar los indicadores.',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="content-card stack">
      <SectionHeader
        eyebrow="Mercado"
        title="Precios e indicadores"
        description="Indicadores curados para lectura rápida del entorno. Este bloque no es un feed en tiempo real."
      />
      {errorMessage ? (
        <p className="error-text">{errorMessage}</p>
      ) : items.length > 0 ? (
        <div className="content-card-grid">
          {items.map((item) => (
            <PriceCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="helper-text">Todavía no hay indicadores visibles.</p>
      )}
    </section>
  )
}
