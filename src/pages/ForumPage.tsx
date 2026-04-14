import { PlaceholderPage } from './PlaceholderPage'

export function ForumPage() {
  return (
    <PlaceholderPage
      audience="Público"
      title="Foro técnico"
      description="Placeholder inicial para el foro visible públicamente."
      route="/forum"
      highlights={[
        'Lectura pública desde esta etapa.',
        'Preparado para interacción autenticada en fases posteriores.',
      ]}
    />
  )
}
