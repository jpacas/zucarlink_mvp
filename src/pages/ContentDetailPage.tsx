import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { SectionHeader } from '../features/content/components/SectionHeader'
import { TagBadge } from '../features/content/components/TagBadge'
import { getPublishedContentBySlug } from '../features/content/api'
import type { ContentItem } from '../features/content/types'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { usePageMetadata } from '../lib/usePageMetadata'

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function ContentDetailPage() {
  const { slug = '' } = useParams()
  const [item, setItem] = useState<ContentItem | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  usePageMetadata({
    title: item?.title ?? 'Contenido',
    description: item?.summary ?? 'Detalle editorial público de Zucarlink.',
  })

  useEffect(() => {
    let isMounted = true

    void getPublishedContentBySlug(slug)
      .then((nextItem) => {
        if (isMounted) {
          setItem(nextItem)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setItem(null)
          setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el contenido.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [slug])

  if (errorMessage) {
    const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

    return (
      <section className="content-card stack">
        <h2>{isPublicDataUnavailable ? 'Contenido en preparación' : 'Contenido no disponible'}</h2>
        <p className={isPublicDataUnavailable ? 'helper-text' : 'error-text'}>
          {isPublicDataUnavailable ? 'El detalle editorial estará disponible pronto.' : errorMessage}
        </p>
      </section>
    )
  }

  if (!item) {
    return (
      <section className="content-card stack">
        <h2>Cargando contenido</h2>
        <p className="helper-text">Estamos trayendo el detalle editorial.</p>
      </section>
    )
  }

  return (
    <article className="content-card stack">
      <SectionHeader as="h1" eyebrow={item.type === 'news' ? 'Noticia' : 'Blog'} title={item.title} />
      <div className="content-item-card__meta">
        <span>{formatPublishedDate(item.publishedAt)}</span>
        {item.sourceName ? <span>{item.sourceName}</span> : null}
      </div>
      <p>{item.summary}</p>
      <div className="tag-row">
        {item.tags.map((tag) => (
          <TagBadge key={tag} label={tag} />
        ))}
      </div>
      <p>{item.body}</p>
      {item.sourceUrl ? (
        <a className="inline-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
          Fuente original
        </a>
      ) : null}
      <section className="info-card stack">
        <h3>Qué puedes hacer después</h3>
        <p className="helper-text">
          Usa este contenido como punto de entrada para descubrir miembros y abrir conversación.
        </p>
        <div className="actions">
          <Link className="button" to="/register">
            Únete a Zucarlink
          </Link>
          <Link className="button button--secondary" to="/forum">
            Participa en el foro
          </Link>
        </div>
      </section>
    </article>
  )
}
