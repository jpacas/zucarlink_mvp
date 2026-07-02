import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { Breadcrumbs } from '../components/Breadcrumbs'
import {
  createForumReply,
  deleteForumReply,
  deleteForumTopic,
  getForumThread,
  getForumTopicLikeState,
  toggleForumTopicLike,
} from '../features/forum/api'
import type { ForumAuthor, ForumReply, ForumThreadDetail } from '../features/forum/types'
import { formatDateTime, formatRelative } from '../lib/date'
import { getInitials } from '../lib/initials'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { HeartIcon, ReplyIcon, TrashIcon } from '../components/ForumIcons'
import { ShareMenu } from '../components/ShareMenu'

interface ReplyNode {
  reply: ForumReply
  children: ReplyNode[]
}

// Construye el árbol de respuestas. Las respuestas directas al tema (sin padre)
// son las raíces visibles; las respuestas a respuestas quedan como hijas.
function buildReplyTree(replies: ForumReply[]): ReplyNode[] {
  const nodes = new Map<string, ReplyNode>()
  replies.forEach((reply) => nodes.set(reply.id, { reply, children: [] }))

  const roots: ReplyNode[] = []
  replies.forEach((reply) => {
    const node = nodes.get(reply.id)
    if (!node) {
      return
    }

    const parent = reply.parentReplyId ? nodes.get(reply.parentReplyId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
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

export function ForumThreadPage() {
  const { threadSlug = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  // Cualquier miembro de Zucarlink con el correo confirmado puede responder.
  const canParticipate = Boolean(user?.email_confirmed_at)
  const [thread, setThread] = useState<ForumThreadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [viewerLiked, setViewerLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(() => new Set())
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)

  const replyTree = useMemo(() => buildReplyTree(thread?.replies ?? []), [thread])

  function toggleExpanded(replyId: string) {
    setExpandedReplies((current) => {
      const next = new Set(current)
      if (next.has(replyId)) {
        next.delete(replyId)
      } else {
        next.add(replyId)
      }
      return next
    })
  }

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    void getForumThread(threadSlug)
      .then((nextThread) => {
        if (!isMounted) {
          return
        }

        setThread(nextThread)
        setErrorMessage(null)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setThread(null)
        setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el tema.')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    // El estado de likes es secundario: un fallo aquí no debe tumbar el tema.
    void getForumTopicLikeState(threadSlug)
      .then((state) => {
        if (!isMounted) {
          return
        }

        setLikeCount(state.likeCount)
        setViewerLiked(state.viewerLiked)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setLikeCount(0)
        setViewerLiked(false)
      })

    return () => {
      isMounted = false
    }
  }, [threadSlug])

  async function handleToggleLike() {
    if (!thread || isLiking) {
      return
    }

    const previous = { likeCount, viewerLiked }
    // Actualización optimista.
    setViewerLiked(!previous.viewerLiked)
    setLikeCount(previous.likeCount + (previous.viewerLiked ? -1 : 1))
    setIsLiking(true)

    try {
      const state = await toggleForumTopicLike(thread.slug)
      setLikeCount(state.likeCount)
      setViewerLiked(state.viewerLiked)
    } catch {
      setLikeCount(previous.likeCount)
      setViewerLiked(previous.viewerLiked)
    } finally {
      setIsLiking(false)
    }
  }

  function handleFocusReply() {
    setReplyTarget(null)
    const textarea = replyTextareaRef.current
    if (textarea) {
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      textarea.focus()
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!thread || !replyBody.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await createForumReply({
        threadSlug: thread.slug,
        body: replyBody,
        parentReplyId: replyTarget?.id ?? null,
      })

      const refreshed = await getForumThread(thread.slug)
      setThread(refreshed)
      setReplyBody('')
      setReplyTarget(null)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible publicar la respuesta.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteThread() {
    if (!thread || isDeleting) {
      return
    }

    const confirmed = window.confirm(
      '¿Eliminar esta conversación y todas sus respuestas? Esta acción no se puede deshacer.',
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteForumTopic(thread.slug)
      navigate('/forum')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible eliminar la conversación.',
      )
      setIsDeleting(false)
    }
  }

  async function handleDeleteReply(node: ReplyNode) {
    if (!thread || isDeleting) {
      return
    }

    const childCount = node.children.length
    const message =
      childCount > 0
        ? `Esta respuesta tiene ${childCount} ${
            childCount === 1 ? 'respuesta' : 'respuestas'
          } que también se eliminarán. ¿Continuar? Esta acción no se puede deshacer.`
        : '¿Eliminar esta respuesta? Esta acción no se puede deshacer.'

    if (!window.confirm(message)) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteForumReply(node.reply.id)
      const refreshed = await getForumThread(thread.slug)
      setThread(refreshed)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible eliminar la respuesta.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  function renderReplyNode(node: ReplyNode, depth: number) {
    const { reply, children } = node
    const isExpanded = expandedReplies.has(reply.id)

    return (
      <article key={reply.id} className="forum-reply stack">
        {reply.parentAuthorName ? (
          <span className="forum-reply__context">↳ En respuesta a {reply.parentAuthorName}</span>
        ) : null}
        <div className="forum-meta-row forum-meta-row--split">
          <ForumAuthorSummary author={reply.author} />
          <time
            className="forum-meta-row__time"
            dateTime={reply.createdAt}
            title={formatDateTime(reply.createdAt)}
          >
            {formatRelative(reply.createdAt)}
          </time>
        </div>
        <p>{reply.body}</p>
        <div className="forum-reply__actions">
          {user ? (
            <button
              className="forum-reply__reply"
              type="button"
              onClick={() =>
                setReplyTarget({
                  id: reply.id,
                  authorName: reply.author.fullName,
                })
              }
            >
              <ReplyIcon />
              Responder
            </button>
          ) : null}
          {children.length > 0 ? (
            <button
              className="forum-reply__toggle"
              type="button"
              onClick={() => toggleExpanded(reply.id)}
              aria-expanded={isExpanded}
            >
              {isExpanded
                ? `Ocultar ${children.length === 1 ? 'respuesta' : 'respuestas'}`
                : `Ver ${children.length} ${children.length === 1 ? 'respuesta' : 'respuestas'}`}
            </button>
          ) : null}
          {user?.id === reply.author.id ? (
            <button
              className="forum-reply__reply forum-reply__delete"
              type="button"
              onClick={() => handleDeleteReply(node)}
              disabled={isDeleting}
            >
              <TrashIcon />
              Eliminar
            </button>
          ) : null}
        </div>
        {children.length > 0 && isExpanded ? (
          <div className="forum-reply__children">
            {children.map((child) => renderReplyNode(child, depth + 1))}
          </div>
        ) : null}
      </article>
    )
  }

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando tema</h2>
        <p className="helper-text">Estamos trayendo la conversación técnica completa.</p>
      </section>
    )
  }

  if (!thread || errorMessage) {
    const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

    return (
      <section className="content-card stack">
        <h2>Tema no disponible</h2>
        <p className={isPublicDataUnavailable ? 'helper-text' : 'error-text'}>
          {isPublicDataUnavailable
            ? 'La conversación estará disponible pronto.'
            : errorMessage ?? 'No encontramos el tema solicitado.'}
        </p>
        <Link className="button button--ghost" to="/forum">
          Volver al foro
        </Link>
      </section>
    )
  }

  return (
    <div className="stack">
      <Breadcrumbs items={[
        { label: 'Inicio', to: '/' },
        { label: 'Foro', to: '/forum' },
        { label: thread.category.name, to: `/forum/category/${thread.category.slug}` },
        { label: thread.title },
      ]} />
      <article className="content-card content-card--ingenio stack forum-original">
        <div className="forum-original__head">
          <p className="eyebrow">Tema original</p>
          <Link className="route-chip" to={`/forum/category/${thread.category.slug}`}>
            {thread.category.name}
          </Link>
        </div>
        <h2>{thread.title}</h2>
        <div className="forum-meta-row forum-meta-row--split">
          <ForumAuthorSummary author={thread.author} />
          <time
            className="forum-meta-row__time"
            dateTime={thread.createdAt}
            title={formatDateTime(thread.createdAt)}
          >
            {formatRelative(thread.createdAt)}
          </time>
        </div>
        <p className="forum-original__body">{thread.body}</p>
        <div className="forum-post-actions">
          {user ? (
            <button
              type="button"
              className={viewerLiked ? 'forum-action forum-action--liked' : 'forum-action'}
              onClick={handleToggleLike}
              disabled={isLiking}
              aria-pressed={viewerLiked}
              aria-label={viewerLiked ? 'Quitar me gusta' : 'Me gusta'}
            >
              <HeartIcon filled={viewerLiked} />
              <span className="forum-action__count">{likeCount}</span>
            </button>
          ) : (
            <Link className="forum-action" to="/login" aria-label="Inicia sesión para reaccionar">
              <HeartIcon filled={false} />
              <span className="forum-action__count">{likeCount}</span>
            </Link>
          )}

          <ShareMenu className="forum-action" url={window.location.href} title={thread.title} />

          {user ? (
            <button
              type="button"
              className="forum-action"
              onClick={handleFocusReply}
              aria-label="Responder"
              disabled={!canParticipate}
              title={canParticipate ? undefined : 'Confirma tu correo para responder'}
            >
              <ReplyIcon />
              <span>Responder</span>
            </button>
          ) : (
            <Link className="forum-action" to="/login" aria-label="Responder">
              <ReplyIcon />
              <span>Responder</span>
            </Link>
          )}

          {user?.id === thread.author.id ? (
            <button
              type="button"
              className="forum-action forum-action--danger"
              onClick={handleDeleteThread}
              disabled={isDeleting}
              aria-label="Eliminar conversación"
            >
              <TrashIcon />
              <span>Eliminar</span>
            </button>
          ) : null}
        </div>
      </article>

      <section className="stack forum-thread-replies">
        <h3 className="forum-replies__title">Respuestas ({thread.replyCount})</h3>

        {replyTree.length > 0 ? (
          <div className="forum-replies">
            {replyTree.map((node) => renderReplyNode(node, 0))}
          </div>
        ) : (
          <p className="helper-text">Todavía no hay respuestas. Sé el primero en aportar.</p>
        )}
      </section>

      {user && canParticipate ? (
        <form className="info-card stack" onSubmit={handleSubmit}>
          <div className="split-header">
            <div className="stack stack--compact">
              <h3>Responder</h3>
              {replyTarget ? (
                <p className="helper-text">Respondiendo a {replyTarget.authorName}</p>
              ) : null}
            </div>
            {replyTarget ? (
              <button
                className="button button--ghost button--sm"
                type="button"
                onClick={() => setReplyTarget(null)}
              >
                Cancelar
              </button>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="forum-reply-body">Tu respuesta</label>
            <textarea
              id="forum-reply-body"
              ref={replyTextareaRef}
              rows={5}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              required
            />
          </div>
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          <div className="actions">
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publicando...' : 'Publicar respuesta'}
            </button>
          </div>
        </form>
      ) : user ? (
        <section className="info-card stack">
          <h3>Confirma tu correo para responder</h3>
          <p className="helper-text">
            Revisa tu bandeja de entrada y confirma tu correo electrónico para participar en el
            foro.
          </p>
        </section>
      ) : (
        <section className="info-card stack">
          <h3>Inicia sesión para comentar</h3>
          <p className="helper-text">
            Puedes leer el foro completo sin registro, pero necesitas sesión para responder.
          </p>
          <div className="actions">
            <Link className="button" to="/login">
              Iniciar sesión
            </Link>
            <Link className="button button--secondary" to="/register">
              Crear cuenta
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
