import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ContentCard } from '../features/content/components/ContentCard'
import { ContentFilters } from '../features/content/components/ContentFilters'
import { SectionHeader } from '../features/content/components/SectionHeader'
import { listPublishedContent } from '../features/content/api'
import type { ContentCategory, ContentItem } from '../features/content/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { usePageMetadata } from '../lib/usePageMetadata'

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
  const [items, setItems] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  usePageMetadata({
    title: 'Noticias del sector',
    description:
      'Actualización pública y curada sobre mercado, operación y señales clave para la industria azucarera.',
  })

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)

    void listPublishedContent('news', {
      query,
      category: selectedCategory ? (selectedCategory as ContentCategory) : undefined,
    })
      .then((nextItems) => {
        if (isMounted) {
          setItems(nextItems)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setItems([])
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar las noticias.',
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
  }, [query, selectedCategory])

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
