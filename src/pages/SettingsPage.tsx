import { PlaceholderPage } from './PlaceholderPage'

export function SettingsPage() {
  return (
    <PlaceholderPage
      audience="Privado"
      title="Ajustes"
      description="Configuraciones mínimas de la cuenta, por ahora sin lógica adicional."
      route="/app/settings"
      highlights={[
        'Disponible solo para el usuario autenticado.',
        'Reservada para preferencias y cuenta en próximas fases.',
      ]}
    />
  )
}
