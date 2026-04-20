import { useEffect, useMemo, useState } from 'react'

import { EventCard } from '../features/content/components/EventCard'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listPublishedEvents } from '../features/content/api'
import type { EventItem } from '../features/content/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { usePageMetadata } from '../lib/usePageMetadata'

export function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  usePageMetadata({
    title: 'Congresos y eventos',
    description:
      'Agenda pública y simple de congresos y eventos relevantes para la industria azucarera.',
  })

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)

    void listPublishedEvents()
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
            error instanceof Error ? error.message : 'No fue posible cargar los eventos.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const [upcoming, past] = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return [
      items.filter((item) => item.startDate >= today),
      items.filter((item) => item.startDate < today),
    ]
  }, [items])
  const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

  return (
    <section className="content-card stack">
      <SectionHeader
        as="h1"
        eyebrow="Agenda"
        title="Congresos y eventos"
        description="Un listado simple para identificar encuentros relevantes sin perderse en un calendario complejo."
      />

      {isLoading ? <p className="helper-text">Cargando eventos.</p> : null}
      {!isLoading && isPublicDataUnavailable ? (
        <p className="helper-text">La agenda se actualizará pronto.</p>
      ) : null}
      {!isLoading && errorMessage && !isPublicDataUnavailable ? (
        <p className="error-text">{errorMessage}</p>
      ) : null}

      <div className="stack">
        <h3>Próximos</h3>
        {isLoading || errorMessage ? null : upcoming.length > 0 ? (
          <div className="content-card-grid">
            {upcoming.map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="helper-text">Aún no hay eventos confirmados para esta agenda.</p>
        )}
      </div>

      <div className="stack">
        <h3>Pasados</h3>
        {isLoading || errorMessage ? null : past.length > 0 ? (
          <div className="content-card-grid">
            {past.map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="helper-text">Todavía no hay un histórico disponible en esta sección.</p>
        )}
      </div>
    </section>
  )
}
