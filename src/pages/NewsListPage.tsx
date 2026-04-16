import { PlaceholderPage } from './PlaceholderPage'

export function NewsListPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Noticias del sector"
      description="Listado público de noticias curadas y relevantes para la industria azucarera."
      route="/informacion/noticias"
      highlights={[
        'Solo mostrará contenido publicado.',
        'Queda listo para filtros, cards y detalle editorial.',
      ]}
    />
  )
}
