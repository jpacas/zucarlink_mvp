import { Link, useParams } from 'react-router-dom'

import { SectionHeader } from '../features/content/components/SectionHeader'
import { TagBadge } from '../features/content/components/TagBadge'
import { getPublishedContentBySlug } from '../features/content/api'
import { formatDate } from '../lib/date'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { useJsonLd } from '../lib/useJsonLd'
import { SITE_URL, usePageMetadata } from '../lib/usePageMetadata'
import { useAsyncData } from '../lib/useAsyncData'

export function ContentDetailPage() {
  const { slug = '' } = useParams()
  const { data: item, error: errorMessage } = useAsyncData(() => getPublishedContentBySlug(slug), [slug])

  usePageMetadata({
    title: item?.title ?? 'Contenido',
    description: item?.summary ?? 'Detalle editorial público de Zucarlink.',
  })
  useJsonLd(
    item
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: item.title,
          description: item.summary,
          datePublished: item.publishedAt,
          inLanguage: 'es',
          mainEntityOfPage: `${SITE_URL}/informacion/${item.slug}`,
          image: item.coverImageUrl || undefined,
          publisher: { '@id': `${SITE_URL}/#organization` },
        }
      : null,
  )

  if (errorMessage) {
    const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

    return (
      <section className="content-card stack">
        <h1>{isPublicDataUnavailable ? 'Contenido en preparación' : 'Contenido no disponible'}</h1>
        <p className={isPublicDataUnavailable ? 'helper-text' : 'error-text'}>
          {isPublicDataUnavailable ? 'El detalle editorial estará disponible pronto.' : errorMessage}
        </p>
      </section>
    )
  }

  if (!item) {
    return (
      <section className="content-card stack">
        <h2>Cargando contenido…</h2>
        <p className="helper-text">Estamos trayendo el detalle editorial.</p>
      </section>
    )
  }

  return (
    <article className="content-card stack">
      <SectionHeader as="h1" eyebrow={item.type === 'news' ? 'Noticia' : 'Blog'} title={item.title} />
      <div className="content-item-card__meta">
        <span>{formatDate(item.publishedAt)}</span>
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
