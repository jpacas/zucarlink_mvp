import { useMemo } from 'react'

import { EventCard } from '../features/content/components/EventCard'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listPublishedEvents } from '../features/content/api'
import type { EventItem } from '../features/content/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { usePageMetadata } from '../lib/usePageMetadata'
import { useAsyncData } from '../lib/useAsyncData'

const monthYearLabel = new Intl.DateTimeFormat('es-SV', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function groupByMonth(items: EventItem[]) {
  const groups: { key: string; label: string; items: EventItem[] }[] = []
  for (const item of items) {
    const key = item.startDate.slice(0, 7)
    const lastGroup = groups[groups.length - 1]
    if (lastGroup?.key === key) {
      lastGroup.items.push(item)
    } else {
      groups.push({
        key,
        label: capitalize(monthYearLabel.format(new Date(item.startDate))),
        items: [item],
      })
    }
  }
  return groups
}

export function EventsPage() {
  const {
    data,
    isLoading,
    error: errorMessage,
  } = useAsyncData<EventItem[]>(() => listPublishedEvents(), [])
  const items = useMemo(() => data ?? [], [data])

  usePageMetadata({
    title: 'Congresos y eventos',
    description:
      'Agenda curada de congresos y ferias de la industria azucarera para planificar la asistencia de los técnicos.',
  })

  const [upcoming, past] = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return [
      items.filter((item) => item.startDate >= today),
      items.filter((item) => item.startDate < today),
    ]
  }, [items])
  const [nextEvent, ...restUpcoming] = upcoming
  const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

  return (
    <section className="content-card stack">
      <SectionHeader
        as="h1"
        eyebrow="Agenda"
        title="Congresos y eventos"
        description="Agenda curada de los encuentros más relevantes de la industria azucarera para planificar la asistencia de los técnicos."
      />

      {isLoading ? <p className="helper-text">Cargando eventos…</p> : null}
      {!isLoading && isPublicDataUnavailable ? (
        <p className="helper-text">La agenda se actualizará pronto.</p>
      ) : null}
      {!isLoading && errorMessage && !isPublicDataUnavailable ? (
        <p className="error-text">{errorMessage}</p>
      ) : null}

      {!isLoading && !errorMessage && nextEvent ? (
        <div className="stack stack--compact">
          <p className="eyebrow">Próximo evento</p>
          <EventCard item={nextEvent} featured />
        </div>
      ) : null}

      <div className="stack">
        <h3>Próximos</h3>
        {isLoading || errorMessage ? null : upcoming.length > 0 ? (
          restUpcoming.length > 0 ? (
            groupByMonth(restUpcoming).map((group) => (
              <div className="stack stack--compact" key={group.key}>
                <p className="eyebrow">{group.label}</p>
                <div className="content-card-grid">
                  {group.items.map((item) => (
                    <EventCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="helper-text">
              Por ahora solo hay un evento próximo confirmado, destacado arriba.
            </p>
          )
        ) : (
          <p className="helper-text">Aún no hay eventos confirmados para esta agenda.</p>
        )}
      </div>

      <div className="stack">
        <h3>Pasados</h3>
        {isLoading || errorMessage ? null : past.length > 0 ? (
          groupByMonth(past).map((group) => (
            <div className="stack stack--compact" key={group.key}>
              <p className="eyebrow">{group.label}</p>
              <div className="content-card-grid">
                {group.items.map((item) => (
                  <EventCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="helper-text">Todavía no hay un histórico disponible en esta sección.</p>
        )}
      </div>
    </section>
  )
}
