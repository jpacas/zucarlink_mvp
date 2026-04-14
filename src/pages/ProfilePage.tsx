import { PlaceholderPage } from './PlaceholderPage'

export function ProfilePage() {
  return (
    <PlaceholderPage
      audience="Privado"
      title="Perfil"
      description="Pantalla reservada para el perfil editable de la siguiente etapa."
      route="/app/profile"
      highlights={[
        'Acceso solo con sesión activa.',
        'Será la base del editor de perfil en Semana 5.',
      ]}
    />
  )
}
