import { ScreenShell } from '../components/ScreenShell'

interface PlaceholderPageProps {
  audience: 'Público' | 'Privado'
  description: string
  highlights?: string[]
  route: string
  title: string
}

export function PlaceholderPage({
  audience,
  description,
  highlights,
  route,
  title,
}: PlaceholderPageProps) {
  return (
    <ScreenShell
      audience={audience}
      description={description}
      highlights={highlights}
      route={route}
      title={title}
    />
  )
}
