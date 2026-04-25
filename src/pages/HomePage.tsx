import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getDirectoryPublicSummary } from '../features/directory/api'
import { listFeaturedContent } from '../features/content/api'
import type { ContentItem } from '../features/content/types'
import { listForumThreads } from '../features/forum/api'
import type { ForumThreadCard } from '../features/forum/types'

export function HomePage() {
  const [forumPreview, setForumPreview] = useState<ForumThreadCard[]>([])
  const [contentPreview, setContentPreview] = useState<ContentItem[]>([])
  const [hasContentPreviewIssue, setHasContentPreviewIssue] = useState(false)
  const [members, setMembers] = useState<number | null>(null)
  const [countries, setCountries] = useState<number | null>(null)
  const [activeThreads, setActiveThreads] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    void getDirectoryPublicSummary()
      .then((summary) => {
        if (isMounted) {
          setMembers(summary.totalMembers)
          setCountries(summary.totalCountries)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void listForumThreads(undefined, 3)
      .then((threads) => {
        if (isMounted) {
          setForumPreview(threads)
          setActiveThreads(threads.length)
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
        <p className="eyebrow">Red profesional · Industria azucarera</p>
        <h1>Conecta con técnicos y especialistas del sector azucarero</h1>
        <p>
          Directorio curado, foro técnico y contacto directo con proveedores —
          todo en una red privada pensada para la industria.
        </p>
        <div className="actions">
          <Link className="button" to="/register">
            Crear mi perfil técnico
          </Link>
          <Link className="button button--secondary" to="/directory">
            Explorar directorio
          </Link>
        </div>

        {(members !== null || countries !== null || activeThreads !== null) ? (
          <div className="activity-strip">
            {members !== null && members > 0 ? (
              <div className="activity-strip__item">
                <span className="activity-strip__value">{members.toLocaleString('es-SV')}</span>
                <span className="activity-strip__label">Miembros activos</span>
              </div>
            ) : null}
            {countries !== null && countries > 0 ? (
              <div className="activity-strip__item">
                <span className="activity-strip__value">{countries}</span>
                <span className="activity-strip__label">Países representados</span>
              </div>
            ) : null}
            {activeThreads !== null && activeThreads > 0 ? (
              <div className="activity-strip__item">
                <span className="activity-strip__value">{activeThreads}+</span>
                <span className="activity-strip__label">Debates recientes</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="section-grid">
        <article className="content-card stack">
          <p className="eyebrow">Para técnicos</p>
          <h2>Criterio, contactos y contexto sectorial</h2>
          <p>
            Participa en debates técnicos, ubica perfiles relevantes y mantente conectado
            sin depender de canales dispersos.
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
          <h2>Presencia útil frente a una audiencia especializada</h2>
          <p>
            Presenta tu empresa, deja clara tu oferta y recibe contacto directo de técnicos
            y tomadores de decisión del sector.
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
