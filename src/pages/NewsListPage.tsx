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

export function NewsListPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  usePageMetadata({
    title: 'Noticias del sector',
    description:
      'Actualización pública y curada sobre mercado, operación y señales clave para la industria azucarera.',
  })

  const {
    data,
    isLoading,
    error: errorMessage,
  } = useAsyncData<ContentItem[]>(
    () =>
      listPublishedContent('news', {
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
        title="Noticias del sector"
        description="Actualización pública, curada y útil para seguir mercado, operación y señales clave de la industria."
      />
      <ContentFilters
        categories={categories}
        query={query}
        selectedCategory={selectedCategory}
        onQueryChange={setQuery}
        onCategoryChange={setSelectedCategory}
      />
      {isLoading ? (
        <p className="helper-text">Cargando noticias.</p>
      ) : isPublicDataUnavailable ? (
        <p className="helper-text">Las noticias se actualizarán pronto.</p>
      ) : errorMessage ? (
        <p className="error-text">{errorMessage}</p>
      ) : items.length > 0 ? (
        <div className="content-card-grid">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="helper-text">No hay noticias publicadas para este filtro.</p>
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
