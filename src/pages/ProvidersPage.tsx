// TODO: reemplazar PlaceholderPage con la landing comercial completa de proveedores
// (catálogo filtrable, generación de leads, llamada a registro de cuenta provider)
import { PlaceholderPage } from './PlaceholderPage'

export function ProvidersPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Proveedores"
      description="Espacio base para la capa comercial ligera del MVP."
      route="/providers"
      highlights={[
        'Accesible públicamente.',
        'Queda listo para catálogo y generación de leads después.',
      ]}
    />
  )
}
