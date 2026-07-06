import { useEffect } from 'react'

/**
 * Inyecta un bloque <script type="application/ld+json"> en el head mientras el
 * componente esté montado. Pasar null mientras los datos aún no cargan.
 */
export function useJsonLd(schema: Record<string, unknown> | null) {
  const json = schema ? JSON.stringify(schema) : null

  useEffect(() => {
    if (!json) {
      return
    }

    const tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.text = json
    document.head.appendChild(tag)

    return () => {
      tag.remove()
    }
  }, [json])
}
