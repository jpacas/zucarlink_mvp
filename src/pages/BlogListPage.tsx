import { PlaceholderPage } from './PlaceholderPage'

export function BlogListPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Artículos y análisis"
      description="Espacio para contenido más profundo, análisis y resúmenes propios."
      route="/informacion/blog"
      highlights={[
        'Comparte backend con noticias pero vive como sección separada.',
        'Queda listo para detalle público por slug.',
      ]}
    />
  )
}
