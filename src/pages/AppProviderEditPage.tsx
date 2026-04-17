import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { ProviderProfileForm } from '../features/providers/ProviderProfileForm'
import {
  createEmptyProviderDraft,
  getCurrentProviderProfile,
  listProviderCategories,
  saveProviderProfile,
} from '../features/providers/api'
import type { ProviderCategory, ProviderProfileDraft } from '../features/providers/types'

export function AppProviderEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ProviderProfileDraft>(createEmptyProviderDraft())
  const [categories, setCategories] = useState<ProviderCategory[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    void Promise.all([getCurrentProviderProfile(user), listProviderCategories()])
      .then(([provider, nextCategories]) => {
        setCategories(nextCategories)

        if (provider) {
          setDraft({
            companyName: provider.companyName,
            categoryId: provider.categoryId,
            countries: provider.countries,
            shortDescription: provider.shortDescription,
            longDescription: provider.longDescription,
            productsServices: provider.productsServices,
            website: provider.website,
            contactEmail: provider.contactEmail,
          })
        }
      })
      .catch((error) =>
        setFeedback(error instanceof Error ? error.message : 'No fue posible cargar el formulario.'),
      )
  }, [user])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const currentUser = user

  async function handleSave() {
    setIsSaving(true)
    setFeedback(null)

    try {
      await saveProviderProfile(currentUser, draft, 'lead')
      navigate('/app/provider', { replace: true })
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="content-card stack">
      <p className="eyebrow">Proveedor</p>
      <h2>Editar perfil comercial</h2>
      <p>Actualiza la información base que verá el público cuando el perfil esté activo.</p>
      {feedback ? <p className="status">{feedback}</p> : null}
      <ProviderProfileForm
        categories={categories}
        draft={draft}
        isSaving={isSaving}
        onChange={setDraft}
        onSubmit={handleSave}
        onSubmitLabel="Guardar perfil comercial"
      />
    </section>
  )
}
