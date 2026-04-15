import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { listForumThreads } from '../features/forum/api'
import type { ForumThreadCard } from '../features/forum/types'

export function HomePage() {
  const [forumPreview, setForumPreview] = useState<ForumThreadCard[]>([])

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
    </div>
  )
}
