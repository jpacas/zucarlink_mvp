import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { createForumReply, getForumThread } from '../features/forum/api'
import type { ForumAuthor, ForumThreadDetail } from '../features/forum/types'

function formatForumDate(value: string) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function verificationLabel(status: 'unverified' | 'pending' | 'verified') {
  switch (status) {
    case 'verified':
      return 'Verificado'
    case 'pending':
      return 'Pendiente'
    default:
      return 'Sin verificar'
  }
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

export function ForumThreadPage() {
  const { threadSlug = '' } = useParams()
  const { user } = useAuth()
  const [thread, setThread] = useState<ForumThreadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    return () => {
      isMounted = false
    }
  }, [threadSlug])

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

  if (isLoading) {
    return (
      <section className="content-card stack">
        <h2>Cargando tema</h2>
        <p className="helper-text">Estamos trayendo la conversación técnica completa.</p>
      </section>
    )
  }

  if (!thread || errorMessage) {
    return (
      <section className="content-card stack">
        <h2>Tema no disponible</h2>
        <p className="error-text">{errorMessage ?? 'No encontramos el tema solicitado.'}</p>
        <Link className="button button--secondary" to="/forum">
          Volver al foro
        </Link>
      </section>
    )
  }

  return (
    <section className="content-card stack">
      <div className="forum-thread-header stack">
        <div className="actions">
          <Link className="inline-link" to="/forum">
            Volver al foro
          </Link>
          <Link className="route-chip" to={`/forum/category/${thread.category.slug}`}>
            {thread.category.name}
          </Link>
        </div>
        <h2>{thread.title}</h2>
        <div className="forum-meta-row">
          <ForumAuthorSummary author={thread.author} />
          <span>{formatForumDate(thread.createdAt)}</span>
          <span>{thread.replyCount} respuestas</span>
          <span>{verificationLabel(thread.author.verificationStatus)}</span>
        </div>
      </div>

      <article className="info-card stack">
        <p>{thread.body}</p>
      </article>

      <section className="stack">
        <div className="split-header">
          <div className="stack stack--compact">
            <h3>Respuestas</h3>
            <p className="helper-text">
              La conversación es pública; participar requiere iniciar sesión.
            </p>
          </div>
        </div>

        {thread.replies.length > 0 ? (
          <div className="forum-replies">
            {thread.replies.map((reply) => (
              <article key={reply.id} className="info-card stack">
                <div className="forum-meta-row">
                  <ForumAuthorSummary author={reply.author} />
                  <span>{formatForumDate(reply.createdAt)}</span>
                  {reply.parentAuthorName ? (
                    <span>Responde a {reply.parentAuthorName}</span>
                  ) : null}
                </div>
                <p>{reply.body}</p>
                {user ? (
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() =>
                      setReplyTarget({
                        id: reply.id,
                        authorName: reply.author.fullName,
                      })
                    }
                  >
                    Responder
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">Todavía no hay respuestas en este tema.</p>
        )}
      </section>

      {user ? (
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
                className="button button--secondary"
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
      ) : (
        <section className="info-card stack">
          <h3>Inicia sesión para comentar</h3>
          <p className="helper-text">
            Puedes leer el foro completo sin registro, pero necesitas sesión para responder.
          </p>
          <div className="actions">
            <Link className="button" to="/login">
              Ingresar para responder
            </Link>
            <Link className="button button--secondary" to="/register">
              Crear cuenta
            </Link>
          </div>
        </section>
      )}
    </section>
  )
}
