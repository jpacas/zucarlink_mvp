import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { listForumCategories, listForumThreads } from '../features/forum/api'
import type { ForumAuthor, ForumCategory, ForumThreadCard } from '../features/forum/types'

function formatForumDate(value: string) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function ForumAuthorSummary({ author }: { author: ForumAuthor }) {
  const [hasAvatarError, setHasAvatarError] = useState(false)
  const canRenderAvatar = Boolean(author.avatarUrl) && !hasAvatarError

  return (
    <div className="forum-author">
      {canRenderAvatar ? (
        <img
          className="forum-author__avatar"
          src={author.avatarUrl ?? undefined}
          alt={author.fullName}
          onError={() => setHasAvatarError(true)}
        />
      ) : (
        <div className="forum-author__fallback" aria-hidden="true">
          {author.fullName.slice(0, 1).toUpperCase() || 'Z'}
        </div>
      )}
      <div className="forum-author__copy">
        <Link className="inline-link" to={`/directory/${author.id}`}>
          {author.fullName}
        </Link>
        <span>{author.roleTitle || 'Miembro'}</span>
      </div>
    </div>
  )
}

export function ForumPage() {
  const { categorySlug } = useParams()
  const { user } = useAuth()
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThreadCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    void Promise.all([
      listForumCategories(),
      listForumThreads(categorySlug),
    ])
      .then(([nextCategories, nextThreads]) => {
        if (!isMounted) {
          return
        }

        setCategories(nextCategories)
        setThreads(nextThreads)
        setErrorMessage(null)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el foro.')
        setCategories([])
        setThreads([])
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [categorySlug])

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug) ?? null,
    [categories, categorySlug],
  )

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Foro técnico</h2>
        <p className="helper-text">Estamos cargando categorías y temas activos.</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="content-card stack">
        <h2>Foro técnico</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    )
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack stack--compact">
          <p className="eyebrow">Público</p>
          <h2>Foro técnico</h2>
          <p>
            Debates prácticos de fábrica, campo y automatización para la industria azucarera.
          </p>
        </div>
        <div className="actions">
          {user ? (
            <Link className="button" to="/forum/new">
              Crear tema
            </Link>
          ) : (
            <Link className="button" to="/register">
              Crear cuenta para participar
            </Link>
          )}
        </div>
      </div>

      <div className="chip-grid">
        <Link className={activeCategory ? 'chip' : 'chip chip--active'} to="/forum">
          Todo
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            className={activeCategory?.slug === category.slug ? 'chip chip--active' : 'chip'}
            to={`/forum/category/${category.slug}`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {threads.length > 0 ? (
        <div className="forum-thread-list" data-testid="forum-thread-list">
          {threads.map((thread) => (
            <article key={thread.id} className="info-card stack">
              <div className="forum-meta-row">
                <Link className="inline-link" to={`/forum/category/${thread.category.slug}`}>
                  {thread.category.name}
                </Link>
                <span>{thread.replyCount} respuestas</span>
                <span>Última actividad {formatForumDate(thread.lastActivityAt)}</span>
              </div>
              <Link className="forum-thread-link" to={`/forum/thread/${thread.slug}`}>
                {thread.title}
              </Link>
              <p>{thread.excerpt}</p>
              <div className="forum-meta-row">
                <ForumAuthorSummary author={thread.author} />
                <span>{formatForumDate(thread.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="info-card stack">
          <h3>{activeCategory ? `Sin temas en ${activeCategory.name}` : 'Sin temas aún'}</h3>
          <p className="helper-text">
            {activeCategory
              ? 'Todavía no hay conversaciones visibles en esta categoría.'
              : 'El foro todavía no tiene conversaciones públicas visibles.'}
          </p>
        </section>
      )}
    </section>
  )
}
