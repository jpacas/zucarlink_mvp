import { PlaceholderPage } from './PlaceholderPage'

export function ContentDetailPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Detalle de contenido"
      description="Vista base para mostrar una noticia o artículo individual por slug."
      route="/informacion/:slug"
      highlights={[
        'Renderizará contenido publicado del tipo noticia o blog.',
        'Eventos quedan fuera de esta ruta en Semana 8.',
      ]}
    />
  )
}
