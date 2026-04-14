import { PlaceholderPage } from './PlaceholderPage'

export function DirectoryPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Directorio"
      description="Pantalla base lista para integrar el directorio en una fase posterior."
      route="/directory"
      highlights={[
        'Visible sin sesión.',
        'Lista para recibir filtros y fichas en Semana 5.',
      ]}
    />
  )
}
