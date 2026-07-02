import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ContentCard } from '../features/content/components/ContentCard'
import { ContentFilters } from '../features/content/components/ContentFilters'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listPublishedContent } from '../features/content/api'
import type { ContentCategory, ContentItem } from '../features/content/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { usePageMetadata } from '../lib/usePageMetadata'
import { useAsyncData } from '../lib/useAsyncData'

const categories: ContentCategory[] = [
  'Mercado',
  'Tecnología',
  'Producción',
  'Agrícola',
  'Energía',
  'Mantenimiento',
  'Sostenibilidad',
  'Regulación',
  'Automatización',
  'Eventos',
  'Innovación',
]

export function BlogListPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  usePageMetadata({
    title: 'Artículos y análisis',
    description:
      'Contexto propio, análisis y lecturas rápidas para convertir señales del sector en criterio útil.',
  })

  const {
    data,
    isLoading,
    error: errorMessage,
  } = useAsyncData<ContentItem[]>(
    () =>
      listPublishedContent('blog', {
        query,
        category: selectedCategory ? (selectedCategory as ContentCategory) : undefined,
      }),
    [query, selectedCategory],
  )
  const items = data ?? []

  const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

  return (
    <section className="content-card stack">
      <SectionHeader
        as="h1"
        eyebrow="Información"
        title="Artículos y análisis"
        description="Piezas más profundas para convertir señales del sector en criterio práctico y contexto propio."
      />
      <ContentFilters
        categories={categories}
        query={query}
        selectedCategory={selectedCategory}
        onQueryChange={setQuery}
        onCategoryChange={setSelectedCategory}
      />
      {isLoading ? (
        <p className="helper-text">Cargando artículos.</p>
      ) : isPublicDataUnavailable ? (
        <p className="helper-text">Los artículos se actualizarán pronto.</p>
      ) : errorMessage ? (
        <p className="error-text">{errorMessage}</p>
      ) : items.length > 0 ? (
        <div className="content-card-grid">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="helper-text">No hay artículos publicados para este filtro.</p>
      )}
      <div className="actions">
        <Link className="button" to="/register">
          Únete a Zucarlink
        </Link>
        <Link className="button button--secondary" to="/forum">
          Participa en el foro
        </Link>
      </div>
    </section>
  )
}
