import { PlaceholderPage } from './PlaceholderPage'

export function PricesPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Precios e indicadores"
      description="Bloque ligero de indicadores y referencias de mercado curadas manualmente."
      route="/informacion/precios"
      highlights={[
        'No busca ser un feed en tiempo real.',
        'Queda listo para mostrar fuente, fecha y nota aclaratoria.',
      ]}
    />
  )
}
