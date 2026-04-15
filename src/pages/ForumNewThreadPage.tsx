import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { createForumTopic, listForumCategories } from '../features/forum/api'
import type { ForumCategory } from '../features/forum/types'
import { getSupabaseBrowserClient } from '../lib/supabase'

export function ForumNewThreadPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [title, setTitle] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [body, setBody] = useState('')
  const [canCreateTopic, setCanCreateTopic] = useState(false)
  const [isResolvingProfile, setIsResolvingProfile] = useState(Boolean(user))
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    void listForumCategories()
      .then((nextCategories) => {
        if (!isMounted) {
          return
        }

        setCategories(nextCategories)
        setCategorySlug(nextCategories[0]?.slug ?? '')
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar categorías.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    if (!user) {
      setCanCreateTopic(false)
      setIsResolvingProfile(false)
      return
    }

    setIsResolvingProfile(true)

    const metadataStatus = user.user_metadata.profile_status

    if (metadataStatus === 'complete' || metadataStatus === 'incomplete') {
      setCanCreateTopic(metadataStatus === 'complete')
      setIsResolvingProfile(false)
      return
    }

    const client = getSupabaseBrowserClient()

    if (!client) {
      setCanCreateTopic(false)
      setIsResolvingProfile(false)
      setErrorMessage('Supabase no está configurado.')
      return
    }

    void (async () => {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('profile_status')
          .eq('id', user.id)
          .maybeSingle()

        if (!isMounted) {
          return
        }

        if (error) {
          throw error
        }

        setCanCreateTopic(data?.profile_status === 'complete')
      } catch (error: unknown) {
        if (!isMounted) {
          return
        }

        setCanCreateTopic(false)
        setErrorMessage(
          error instanceof Error ? error.message : 'No fue posible validar el perfil.',
        )
      } finally {
        if (isMounted) {
          setIsResolvingProfile(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [user])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!categorySlug || !title.trim() || !body.trim()) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const created = await createForumTopic({
        categorySlug,
        title,
        body,
      })

      navigate(`/forum/thread/${created.slug}`, { replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible publicar el tema.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || isResolvingProfile || isLoadingCategories) {
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

  if (errorMessage && !canCreateTopic && categories.length === 0) {
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
        <p className="helper-text">Completa tu perfil para abrir un tema nuevo.</p>
        <div className="actions">
          <Link className="button" to="/onboarding">
            Completar perfil
          </Link>
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
        <Link className="button button--secondary" to="/forum">
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
            {categories.map((category) => (
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
