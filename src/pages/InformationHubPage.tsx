import { Link } from 'react-router-dom'

import { FeaturedContent } from '../features/content/components/FeaturedContent'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listFeaturedContent } from '../features/content/api'
import { useAuth } from '../features/auth/AuthProvider'
import { usePageMetadata } from '../lib/usePageMetadata'
import { useAsyncData } from '../lib/useAsyncData'
import { BlogIcon, EventIcon, NewsIcon, PriceIcon } from '../components/InfoIcons'
import type { ReactNode } from 'react'

type ModuleRole = 'ingenio' | 'info' | 'proveedor' | 'tecnico'

interface InformationSection {
  title: string
  description: string
  to: string
  role: ModuleRole
  icon: ReactNode
}

const informationSections: InformationSection[] = [
  {
    title: 'Noticias',
    description: 'Actualización curada del sector con foco práctico para ingenios y proveedores.',
    to: '/informacion/noticias',
    role: 'ingenio',
    icon: <NewsIcon />,
  },
  {
    title: 'Blog',
    description: 'Análisis, contexto y lecturas rápidas para convertir ruido en criterio útil.',
    to: '/informacion/blog',
    role: 'info',
    icon: <BlogIcon />,
  },
  {
    title: 'Eventos',
    description: 'Agenda curada de congresos y ferias para planificar la asistencia de los técnicos.',
    to: '/informacion/eventos',
    role: 'proveedor',
    icon: <EventIcon />,
  },
  {
    title: 'Precios',
    description: 'Indicadores seleccionados para seguir mercado, energía y etanol sin complejidad extra.',
    to: '/informacion/precios',
    role: 'tecnico',
    icon: <PriceIcon />,
  },
]

export function InformationHubPage() {
  const { user } = useAuth()
  usePageMetadata({
    title: 'Información',
    description:
      'Noticias, análisis, eventos e indicadores curados para seguirle el pulso a la industria azucarera.',
  })

  const { data, isLoading, error: errorMessage } = useAsyncData(() => listFeaturedContent(4), [])
  const featuredItems = data ?? []

  return (
    <div className="stack">
      <section className="hero-card stack">
        <p className="eyebrow">Información</p>
        <h1>Información para seguirle el pulso al sector</h1>
        <p>
          Noticias, análisis, eventos e indicadores curados para seguir el sector con criterio y
          volver a la plataforma por contexto útil, no por ruido.
        </p>
        <div className="actions">
          {!user ? (
            <Link className="button" to="/register">
              Únete a Zucarlink
            </Link>
          ) : null}
          <Link className={user ? 'button' : 'button button--secondary'} to="/forum">
            Ver foro
          </Link>
        </div>
      </section>

      <section className="content-card stack">
        <SectionHeader
          eyebrow="Hub"
          title="Explora el módulo"
          description="Cada sección mantiene el mismo criterio: curación humana, lectura rápida y utilidad real."
        />
        <div className="content-card-grid">
          {informationSections.map((section) => (
            <article
              key={section.to}
              className={`content-item-card stack module-card module-card--${section.role}`}
            >
              <span className="module-card__icon" aria-hidden="true">
                {section.icon}
              </span>
              <Link className="module-card__title content-item-card__heading" to={section.to}>
                {section.title}
              </Link>
              <p>{section.description}</p>
              <span className="module-card__arrow" aria-hidden="true">
                →
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card stack">
        {isLoading ? (
          <p className="helper-text">Cargando destacados editoriales…</p>
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
