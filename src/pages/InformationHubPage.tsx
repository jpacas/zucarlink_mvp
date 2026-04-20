import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { FeaturedContent } from '../features/content/components/FeaturedContent'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listFeaturedContent } from '../features/content/api'
import type { ContentItem } from '../features/content/types'
import { usePageMetadata } from '../lib/usePageMetadata'

const informationSections = [
  {
    title: 'Noticias',
    description: 'Actualización curada del sector con foco práctico para ingenios y proveedores.',
    to: '/informacion/noticias',
  },
  {
    title: 'Blog',
    description: 'Análisis, contexto y lecturas rápidas para convertir ruido en criterio útil.',
    to: '/informacion/blog',
  },
  {
    title: 'Eventos',
    description: 'Agenda simple de congresos y encuentros relevantes para la industria.',
    to: '/informacion/eventos',
  },
  {
    title: 'Precios',
    description: 'Indicadores seleccionados para seguir mercado, energía y etanol sin complejidad extra.',
    to: '/informacion/precios',
  },
]

export function InformationHubPage() {
  const [featuredItems, setFeaturedItems] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  usePageMetadata({
    title: 'Información',
    description:
      'Noticias, análisis, eventos e indicadores curados para seguirle el pulso a la industria azucarera.',
  })

  useEffect(() => {
    let isMounted = true

    void listFeaturedContent(4)
      .then((items) => {
        if (isMounted) {
          setFeaturedItems(items)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setFeaturedItems([])
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar los destacados.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="stack">
      <section className="hero-card stack">
        <p className="eyebrow">Información</p>
        <h2>Información para seguirle el pulso al sector</h2>
        <p>
          Noticias, análisis, eventos e indicadores curados para seguir el sector con criterio y
          volver a la plataforma por contexto útil, no por ruido.
        </p>
        <div className="actions">
          <Link className="button" to="/register">
            Únete a Zucarlink
          </Link>
          <Link className="button button--secondary" to="/forum">
            Ver foro
          </Link>
        </div>
      </section>

      <section className="content-card stack">
        <SectionHeader
          as="h1"
          eyebrow="Hub"
          title="Explora el módulo"
          description="Cada sección mantiene el mismo criterio: curación humana, lectura rápida y utilidad real."
        />
        <div className="content-card-grid">
          {informationSections.map((section) => (
            <article key={section.to} className="content-item-card stack">
              <h3 className="content-item-card__heading">{section.title}</h3>
              <p>{section.description}</p>
              <Link className="inline-link" to={section.to}>
                {section.title}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card stack">
        {isLoading ? (
          <p className="helper-text">Cargando destacados editoriales.</p>
        ) : errorMessage ? (
          <>
            <SectionHeader
              eyebrow="Curación"
              title="Destacados en preparación"
              description="La próxima selección editorial aparecerá aquí."
            />
          </>
        ) : featuredItems.length > 0 ? (
          <FeaturedContent items={featuredItems} />
        ) : (
          <>
            <SectionHeader
              eyebrow="Curación"
              title="Destacados de la semana"
              description="Aquí verás las piezas seleccionadas cuando haya nueva curación publicada."
            />
            <p className="helper-text">Todavía no hay piezas destacadas visibles.</p>
          </>
        )}
      </section>
    </div>
  )
}
