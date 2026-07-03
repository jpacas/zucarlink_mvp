import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AttachmentInput } from '../components/AttachmentInput'
import { useAuth } from '../features/auth/AuthProvider'
import { createForumTopic, listForumCategories } from '../features/forum/api'
import type { ForumAttachmentType } from '../features/forum/types'
import { removeForumAttachment, uploadForumAttachment } from '../lib/media-storage'
import { useAsyncData } from '../lib/useAsyncData'
import { usePageMetadata } from '../lib/usePageMetadata'

export function ForumNewThreadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  usePageMetadata({
    title: 'Nuevo tema',
    description: 'Abre un tema nuevo en el foro técnico de Zucarlink.',
  })
  const [title, setTitle] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [body, setBody] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  // Basta con ser miembro de Zucarlink con el correo confirmado.
  const canCreateTopic = Boolean(user?.email_confirmed_at)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: loadErrorMessage,
  } = useAsyncData(() => listForumCategories(), [])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Selecciona la primera categoría por defecto SOLO la primera vez que llegan datos,
  // sin sobreescribir una selección posterior del usuario (el <select> es mutable).
  useEffect(() => {
    if (categories && categories.length > 0 && !categorySlug) {
      setCategorySlug(categories[0].slug)
    }
  }, [categories])

  // `errorMessage` se mantiene como estado local (sembrado desde el hook) porque
  // también se reutiliza para errores del envío del formulario (`handleSubmit`),
  // no solo para el error de carga de categorías.
  useEffect(() => {
    setErrorMessage(loadErrorMessage)
  }, [loadErrorMessage])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!categorySlug || !title.trim() || !body.trim()) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    let uploadedPath: string | null = null
    let uploadedType: ForumAttachmentType | null = null

    try {
      if (attachmentFile && user) {
        const uploaded = await uploadForumAttachment({ file: attachmentFile, userId: user.id })
        uploadedPath = uploaded.path
        uploadedType = uploaded.type
      }

      const created = await createForumTopic({
        categorySlug,
        title,
        body,
        attachmentPath: uploadedPath,
        attachmentType: uploadedType,
      })

      navigate(`/forum/thread/${created.slug}`, { replace: true })
    } catch (error) {
      if (uploadedPath) {
        void removeForumAttachment(uploadedPath).catch(() => {})
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible publicar el tema.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || isLoadingCategories) {
    return (
      <section className="content-card stack">
        <h2>Crear tema</h2>
        <p className="helper-text">Estamos preparando el formulario del debate.</p>
      </section>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (errorMessage && !canCreateTopic && (categories?.length ?? 0) === 0) {
    return (
      <section className="content-card stack">
        <h2>Crear tema</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    )
  }

  if (!canCreateTopic) {
    return (
      <section className="content-card stack">
        <h2>Crear tema</h2>
        <p className="helper-text">Confirma tu correo para abrir un tema nuevo.</p>
        <div className="actions">
          <Link className="button button--secondary" to="/forum">
            Volver al foro
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack stack--compact">
          <p className="eyebrow">Foro</p>
          <h2>Crear tema</h2>
        </div>
        <Link className="button button--ghost" to="/forum">
          Cancelar
        </Link>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="forum-title">Título</label>
          <input
            id="forum-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="forum-category">Categoría</label>
          <select
            id="forum-category"
            value={categorySlug}
            onChange={(event) => setCategorySlug(event.target.value)}
            required
          >
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="forum-body">Contenido</label>
          <textarea
            id="forum-body"
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            minLength={24}
            required
          />
        </div>
        <div className="field">
          <AttachmentInput
            file={attachmentFile}
            onSelect={setAttachmentFile}
            disabled={isSubmitting}
          />
        </div>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        <div className="actions">
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publicando...' : 'Publicar tema'}
          </button>
        </div>
      </form>
    </section>
  )
}
