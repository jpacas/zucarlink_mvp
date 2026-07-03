import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import {
  createForumReply,
  deleteForumTopic,
  listForumCategories,
  listForumThreads,
  toggleForumTopicLike,
} from '../features/forum/api'
import type { ForumAuthor, ForumThreadCard } from '../features/forum/types'
import { getInitials } from '../lib/initials'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { Skeleton } from '../components/Skeleton'
import { HeartIcon, ReplyIcon, TrashIcon } from '../components/ForumIcons'
import { ShareMenu } from '../components/ShareMenu'
import { formatDateTime, formatRelative } from '../lib/date'
import { useAsyncData } from '../lib/useAsyncData'
import { usePageMetadata } from '../lib/usePageMetadata'

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          onError={() => setHasAvatarError(true)}
        />
      ) : (
        <div className="forum-author__fallback" aria-hidden="true">
          {getInitials(author.fullName)}
        </div>
      )}
      <div className="forum-author__copy">
        <Link className="forum-author__name" to={`/directory/${author.id}`}>
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
  usePageMetadata({
    title: 'Foro técnico',
    description:
      'Debates técnicos entre profesionales de la industria azucarera: producción, mantenimiento, tecnología y más.',
  })
  // Cualquier miembro de Zucarlink con el correo confirmado puede participar.
  const canParticipate = Boolean(user?.email_confirmed_at)
  const [threads, setThreads] = useState<ForumThreadCard[]>([])
  const [pendingLike, setPendingLike] = useState<string | null>(null)
  const [composeSlug, setComposeSlug] = useState<string | null>(null)
  const [composeBody, setComposeBody] = useState('')
  const [composeSubmitting, setComposeSubmitting] = useState(false)
  const [composeError, setComposeError] = useState<string | null>(null)
  const [flashSlug, setFlashSlug] = useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  function updateThread(slug: string, patch: Partial<ForumThreadCard>) {
    setThreads((current) =>
      current.map((thread) => (thread.slug === slug ? { ...thread, ...patch } : thread)),
    )
  }

  async function handleToggleLike(thread: ForumThreadCard) {
    if (pendingLike === thread.slug) {
      return
    }

    const nextLiked = !thread.viewerLiked
    setPendingLike(thread.slug)
    // Actualización optimista de la tarjeta.
    updateThread(thread.slug, {
      viewerLiked: nextLiked,
      likeCount: thread.likeCount + (nextLiked ? 1 : -1),
    })

    try {
      const state = await toggleForumTopicLike(thread.slug)
      updateThread(thread.slug, { viewerLiked: state.viewerLiked, likeCount: state.likeCount })
    } catch {
      updateThread(thread.slug, {
        viewerLiked: thread.viewerLiked,
        likeCount: thread.likeCount,
      })
    } finally {
      setPendingLike(null)
    }
  }

  async function handleDeleteThread(thread: ForumThreadCard) {
    if (deletingSlug) {
      return
    }

    const confirmed = window.confirm(
      '¿Eliminar esta conversación y todas sus respuestas? Esta acción no se puede deshacer.',
    )

    if (!confirmed) {
      return
    }

    setDeletingSlug(thread.slug)
    setDeleteError(null)

    try {
      await deleteForumTopic(thread.slug)
      setThreads((current) => current.filter((item) => item.slug !== thread.slug))
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'No fue posible eliminar la conversación.',
      )
    } finally {
      setDeletingSlug(null)
    }
  }

  function toggleCompose(slug: string) {
    setComposeError(null)
    setComposeBody('')
    setComposeSlug((current) => (current === slug ? null : slug))
  }

  async function handleComposeSubmit(
    event: React.FormEvent<HTMLFormElement>,
    thread: ForumThreadCard,
  ) {
    event.preventDefault()

    if (!composeBody.trim()) {
      return
    }

    setComposeSubmitting(true)

    try {
      await createForumReply({ threadSlug: thread.slug, body: composeBody, parentReplyId: null })
      updateThread(thread.slug, { replyCount: thread.replyCount + 1 })
      setComposeSlug(null)
      setComposeBody('')
      setComposeError(null)
      setFlashSlug(thread.slug)
      window.setTimeout(
        () => setFlashSlug((current) => (current === thread.slug ? null : current)),
        2500,
      )
    } catch (error) {
      setComposeError(
        error instanceof Error ? error.message : 'No fue posible publicar la respuesta.',
      )
    } finally {
      setComposeSubmitting(false)
    }
  }

  const { data, isLoading, error: errorMessage } = useAsyncData(
    () =>
      Promise.all([listForumCategories(), listForumThreads(categorySlug)]).then(
        ([nextCategories, nextThreads]) => ({ categories: nextCategories, threads: nextThreads }),
      ),
    [categorySlug],
  )
  const categories = data?.categories ?? []

  // `threads` se mantiene como estado local (no puramente derivado de `data`) porque
  // recibe actualizaciones optimistas (like, respuestas, eliminar) que no deben
  // esperar a un recarga completa del hook.
  useEffect(() => {
    if (data) {
      setThreads(data.threads)
    }
  }, [data])

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug) ?? null,
    [categories, categorySlug],
  )

  const filteredThreads = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())
    if (!normalizedQuery) {
      return threads
    }

    return threads.filter((thread) =>
      normalizeText(
        `${thread.title} ${thread.excerpt} ${thread.body} ${thread.author.fullName} ${thread.category.name}`,
      ).includes(normalizedQuery),
    )
  }, [threads, query])

  const hasActiveQuery = query.trim().length > 0

  if (isLoading) {
    return (
      <section className="content-card stack">
        <div className="split-header">
          <div className="stack stack--compact">
            <Skeleton variant="text" width="60px" />
            <Skeleton variant="heading" />
          </div>
        </div>
        <div className="chip-grid" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="chip" />)}
        </div>
        <div className="forum-thread-list" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className="info-card stack">
              <Skeleton variant="text" width="100px" />
              <Skeleton variant="heading" />
              <Skeleton variant="text" width="85%" />
              <div className="forum-meta-row">
                <Skeleton variant="avatar-sm" />
                <Skeleton variant="text" width="80px" />
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  if (errorMessage) {
    const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

    return (
      <section className="content-card stack">
        <h2>Foro técnico</h2>
        <p className={isPublicDataUnavailable ? 'helper-text' : 'error-text'}>
          {isPublicDataUnavailable ? 'El foro público estará disponible pronto.' : errorMessage}
        </p>
      </section>
    )
  }

  return (
    <section className="content-card content-card--ingenio stack">
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
            canParticipate ? (
              <Link className="button" to="/forum/new">
                Crear tema
              </Link>
            ) : (
              <div className="stack stack--compact">
                <button type="button" className="button" disabled title="Confirma tu correo para crear temas">
                  Crear tema
                </button>
                <p className="helper-text" style={{ fontSize: '0.8rem' }}>
                  Confirma tu correo para participar
                </p>
              </div>
            )
          ) : (
            <Link className="button" to="/register">
              Crear cuenta
            </Link>
          )}
        </div>
      </div>

      <div className="field forum-search">
        <label htmlFor="forum-search">Buscar por palabra clave</label>
        <input
          id="forum-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej. clarificación, vapor, molienda, autor…"
        />
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

      {deleteError ? (
        <p className="error-text" role="alert">
          {deleteError}
        </p>
      ) : null}

      {hasActiveQuery && threads.length > 0 ? (
        <p className="helper-text" role="status" aria-live="polite">
          {filteredThreads.length === 1
            ? `1 resultado para «${query.trim()}»`
            : `${filteredThreads.length} resultados para «${query.trim()}»`}
        </p>
      ) : null}

      {filteredThreads.length > 0 ? (
        <div className="forum-thread-list" data-testid="forum-thread-list">
          {filteredThreads.map((thread) => (
            <article key={thread.id} className="info-card stack forum-card--link">
              <div className="forum-meta-row forum-meta-row--split">
                <Link className="route-chip" to={`/forum/category/${thread.category.slug}`}>
                  {thread.category.name}
                </Link>
                <time
                  className="forum-meta-row__time"
                  dateTime={thread.lastActivityAt}
                  title={`Actividad ${formatDateTime(thread.lastActivityAt)}`}
                >
                  {formatRelative(thread.lastActivityAt)}
                </time>
              </div>
              <Link className="forum-thread-link" to={`/forum/thread/${thread.slug}`}>
                {thread.title}
              </Link>
              <p>{thread.excerpt}</p>
              <div className="forum-card__footer">
                <ForumAuthorSummary author={thread.author} />
                <div className="forum-card__actions">
                  {user ? (
                    <button
                      type="button"
                      className={
                        thread.viewerLiked
                          ? 'forum-action forum-action--sm forum-action--liked'
                          : 'forum-action forum-action--sm'
                      }
                      onClick={() => handleToggleLike(thread)}
                      disabled={pendingLike === thread.slug}
                      aria-pressed={thread.viewerLiked}
                      aria-label={thread.viewerLiked ? 'Quitar me gusta' : 'Me gusta'}
                      title={`${thread.likeCount} me gusta`}
                    >
                      <HeartIcon filled={thread.viewerLiked} />
                      <span className="forum-action__count">{thread.likeCount}</span>
                    </button>
                  ) : (
                    <Link
                      className="forum-action forum-action--sm"
                      to="/login"
                      aria-label="Inicia sesión para reaccionar"
                      title={`${thread.likeCount} me gusta`}
                    >
                      <HeartIcon filled={false} />
                      <span className="forum-action__count">{thread.likeCount}</span>
                    </Link>
                  )}

                  {user ? (
                    <button
                      type="button"
                      className="forum-action forum-action--sm"
                      onClick={() => toggleCompose(thread.slug)}
                      aria-expanded={composeSlug === thread.slug}
                      aria-label="Responder"
                      title={
                        canParticipate
                          ? `${thread.replyCount} respuestas`
                          : 'Confirma tu correo para responder'
                      }
                      disabled={!canParticipate}
                    >
                      <ReplyIcon />
                      <span>Responder</span>
                      <span className="forum-action__count">{thread.replyCount}</span>
                    </button>
                  ) : (
                    <Link
                      className="forum-action forum-action--sm"
                      to="/login"
                      aria-label="Responder"
                      title={`${thread.replyCount} respuestas`}
                    >
                      <ReplyIcon />
                      <span>Responder</span>
                      <span className="forum-action__count">{thread.replyCount}</span>
                    </Link>
                  )}

                  <ShareMenu
                    url={`${window.location.origin}/forum/thread/${thread.slug}`}
                    title={thread.title}
                  />

                  {user?.id === thread.author.id ? (
                    <button
                      type="button"
                      className="forum-action forum-action--sm forum-action--danger"
                      onClick={() => handleDeleteThread(thread)}
                      disabled={deletingSlug === thread.slug}
                      aria-label="Eliminar conversación"
                      title="Eliminar conversación"
                    >
                      <TrashIcon />
                      <span>Eliminar</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {flashSlug === thread.slug ? (
                <p className="helper-text" role="status">
                  Respuesta publicada.
                </p>
              ) : null}

              {composeSlug === thread.slug ? (
                <form
                  className="forum-quick-reply stack"
                  onSubmit={(event) => handleComposeSubmit(event, thread)}
                >
                  <textarea
                    aria-label={`Responder a ${thread.title}`}
                    rows={3}
                    value={composeBody}
                    onChange={(event) => setComposeBody(event.target.value)}
                    placeholder="Escribe tu respuesta…"
                    required
                  />
                  {composeError ? <p className="error-text">{composeError}</p> : null}
                  <div className="actions">
                    <button className="button button--sm" type="submit" disabled={composeSubmitting}>
                      {composeSubmitting ? 'Publicando…' : 'Publicar respuesta'}
                    </button>
                    <button
                      className="button button--ghost button--sm"
                      type="button"
                      onClick={() => toggleCompose(thread.slug)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      ) : hasActiveQuery && threads.length > 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 14l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>Sin resultados para «{query.trim()}»</h3>
          <p>
            No encontramos temas que coincidan con tu búsqueda
            {activeCategory ? ` en ${activeCategory.name}` : ''}. Prueba con otra palabra clave.
          </p>
          <div className="actions">
            <button type="button" className="button button--ghost" onClick={() => setQuery('')}>
              Limpiar búsqueda
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 14l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>{activeCategory ? `Sin temas en ${activeCategory.name}` : 'Sin temas aún'}</h3>
          <p>
            {activeCategory
              ? 'Todavía no hay conversaciones visibles en esta categoría. ¡Sé el primero!'
              : 'El foro todavía no tiene conversaciones públicas visibles.'}
          </p>
          {user && canParticipate ? (
            <div className="actions">
              <Link
                className="button"
                to={activeCategory ? `/forum/new?category=${activeCategory.slug}` : '/forum/new'}
              >
                Abrir debate
              </Link>
            </div>
          ) : user ? (
            <p className="helper-text">Confirma tu correo para participar en el foro.</p>
          ) : (
            <div className="actions">
              <Link className="button button--secondary" to="/register">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
