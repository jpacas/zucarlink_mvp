import { PlaceholderPage } from './PlaceholderPage'

export function EventsPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Congresos y eventos"
      description="Agenda pública y simple de eventos relevantes del sector."
      route="/informacion/eventos"
      highlights={[
        'Semana 8 usa listado simple, no calendario.',
        'Queda listo para separar próximos y pasados.',
      ]}
    />
  )
}
