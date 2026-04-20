import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listFeaturedContent } from '../features/content/api'
import type { ContentItem } from '../features/content/types'
import { listForumThreads } from '../features/forum/api'
import type { ForumThreadCard } from '../features/forum/types'

export function HomePage() {
  const [forumPreview, setForumPreview] = useState<ForumThreadCard[]>([])
  const [contentPreview, setContentPreview] = useState<ContentItem[]>([])
  const [hasContentPreviewIssue, setHasContentPreviewIssue] = useState(false)

  useEffect(() => {
    let isMounted = true

    void listForumThreads(undefined, 3)
      .then((threads) => {
        if (isMounted) {
          setForumPreview(threads)
        }
      })
      .catch(() => {
        if (isMounted) {
          setForumPreview([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void listFeaturedContent(2)
      .then((items) => {
        if (isMounted) {
          setContentPreview(items)
          setHasContentPreviewIssue(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setContentPreview([])
          setHasContentPreviewIssue(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="stack">
      <section className="hero-card stack hero-card--home">
        <p className="eyebrow">Industria azucarera</p>
        <h2>La red profesional de la industria azucarera en un solo lugar</h2>
        <p>
          Zucarlink reúne perfiles técnicos, conversaciones útiles y visibilidad comercial en una
          plataforma enfocada en contactos de valor, criterio técnico y oportunidades reales.
        </p>
        <div className="actions">
          <Link className="button" to="/register">
            Crear cuenta
          </Link>
          <Link className="button button--secondary" to="/directory">
            Explorar directorio
          </Link>
          <Link className="button button--secondary" to="/proveedores">
            Ver proveedores
          </Link>
        </div>
      </section>

      <section className="section-grid">
        <article className="content-card stack">
          <p className="eyebrow">Para técnicos</p>
          <h3>Encuentra criterio, contactos y contexto sectorial</h3>
          <p>
            Participa en conversaciones técnicas, ubica perfiles relevantes y sigue señales del
            sector sin depender de canales dispersos.
          </p>
          <div className="actions">
            <Link className="inline-link" to="/forum">
              Ir al foro
            </Link>
            <Link className="inline-link" to="/informacion">
              Ver información
            </Link>
          </div>
        </article>

        <article className="content-card stack">
          <p className="eyebrow">Para proveedores</p>
          <h3>Gana presencia útil frente a una audiencia especializada</h3>
          <p>
            Presenta tu empresa, deja clara tu oferta y abre contacto interno con técnicos y
            tomadores de decisión del sector.
          </p>
          <div className="actions">
            <Link className="inline-link" to="/proveedores/directorio">
              Ver directorio de proveedores
            </Link>
            <Link className="inline-link" to="/register">
              Solicitar activación
            </Link>
          </div>
        </article>
      </section>

      <section className="section-grid">
        <article className="content-card stack">
          <p className="eyebrow">Foro</p>
          <h2>Conversaciones técnicas activas</h2>
          {forumPreview.length > 0 ? (
            <div className="stack">
              {forumPreview.map((thread) => (
                <article key={thread.id} className="info-card stack">
                  <Link className="forum-thread-link" to={`/forum/thread/${thread.slug}`}>
                    {thread.title}
                  </Link>
                  <div className="forum-meta-row">
                    <span>{thread.category.name}</span>
                    <span>{thread.replyCount} respuestas</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="helper-text">
              Las nuevas discusiones aparecerán aquí cuando el foro tenga actividad visible.
            </p>
          )}
          <div className="actions">
            <Link className="button button--secondary" to="/forum">
              Ver foro
            </Link>
          </div>
        </article>

        <article className="content-card stack">
          <p className="eyebrow">Información</p>
          <h2>Lecturas y señales del sector</h2>
          {hasContentPreviewIssue ? (
            <p className="helper-text">La selección editorial se actualizará aquí pronto.</p>
          ) : contentPreview.length > 0 ? (
            <div className="stack">
              {contentPreview.map((item) => (
                <article key={item.id} className="info-card stack">
                  <Link className="forum-thread-link" to={`/informacion/${item.slug}`}>
                    {item.title}
                  </Link>
                  <div className="forum-meta-row">
                    <span>{item.category}</span>
                    <span>{item.sourceName ?? 'Zucarlink'}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="helper-text">
              La selección editorial se actualizará aquí pronto.
            </p>
          )}
          <div className="actions">
            <Link className="button button--secondary" to="/informacion">
              Ver información
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
