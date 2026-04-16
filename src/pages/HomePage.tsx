import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listFeaturedContent } from '../features/content/api'
import type { ContentItem } from '../features/content/types'
import { listForumThreads } from '../features/forum/api'
import type { ForumThreadCard } from '../features/forum/types'

export function HomePage() {
  const [forumPreview, setForumPreview] = useState<ForumThreadCard[]>([])
  const [contentPreview, setContentPreview] = useState<ContentItem[]>([])
  const [contentPreviewError, setContentPreviewError] = useState<string | null>(null)

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
          setContentPreviewError(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setContentPreview([])
          setContentPreviewError(
            error instanceof Error ? error.message : 'No fue posible cargar la vista previa editorial.',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="section-grid">
      <section className="hero-card">
        <p className="eyebrow">Semana 7</p>
        <h2>Foro técnico público para activar conversación real</h2>
        <p>
          Zucarlink ya combina perfiles, directorio y un foro público donde la industria puede
          leer debates reales y participar con identidad técnica.
        </p>
        <div className="actions">
          <Link className="button" to="/forum">
            Ver foro
          </Link>
          <Link className="button button--secondary" to="/directory">
            Ver directorio público
          </Link>
        </div>
      </section>

      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Rutas públicas</p>
            <h2>Exploración inicial</h2>
          </div>
          <span className="route-chip">sin sesión</span>
        </div>
        <ul className="list">
          <li>`/` inicio</li>
          <li>`/login` acceso</li>
          <li>`/register` registro</li>
          <li>`/directory` resumen agregado del directorio</li>
          <li>`/forum` foro técnico público</li>
          <li>`/informacion` noticias, blog, eventos e indicadores</li>
          <li>`/providers` proveedores</li>
        </ul>
      </section>

      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Rutas privadas</p>
            <h2>Área autenticada</h2>
          </div>
          <span className="route-chip">requiere sesión</span>
        </div>
        <ul className="list">
          <li>`/app` panel</li>
          <li>`/app/directory` directorio privado</li>
          <li>`/forum/new` crear tema con perfil completo</li>
          <li>`/app/profile` perfil</li>
          <li>`/app/messages` mensajes</li>
          <li>`/app/settings` ajustes</li>
        </ul>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Preview</p>
        <h2>Conversaciones activas en el foro</h2>
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
            Los debates recientes aparecerán aquí cuando el foro tenga actividad visible.
          </p>
        )}
        <div className="actions">
          <Link className="button button--secondary" to="/forum">
            Ver foro
          </Link>
        </div>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Preview</p>
        <h2>Información útil para volver al sitio</h2>
        {contentPreviewError ? (
          <p className="error-text">{contentPreviewError}</p>
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
            Los contenidos destacados aparecerán aquí cuando la capa editorial esté publicada.
          </p>
        )}
        <div className="actions">
          <Link className="button button--secondary" to="/informacion">
            Ver información
          </Link>
        </div>
      </section>
    </div>
  )
}
