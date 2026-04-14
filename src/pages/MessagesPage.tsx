import { PlaceholderPage } from './PlaceholderPage'

export function MessagesPage() {
  return (
    <PlaceholderPage
      audience="Privado"
      title="Mensajes"
      description="Placeholder privado para el módulo de mensajería."
      route="/app/messages"
      highlights={[
        'Ruta protegida por auth.',
        'Lista para conversaciones 1 a 1 más adelante.',
      ]}
    />
  )
}
