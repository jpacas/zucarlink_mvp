import { PlaceholderPage } from './PlaceholderPage'

export function InformationHubPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Información"
      description="Hub público para noticias, artículos, eventos e indicadores curados."
      route="/informacion"
      highlights={[
        'Agrupa noticias, blog, congresos y precios en una sola entrada pública.',
        'Queda listo para conectar CTAs a registro y foro en la siguiente tarea.',
      ]}
    />
  )
}
