import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ProviderProfileForm } from '../features/providers/ProviderProfileForm'
import { ProviderLogoUploader } from '../features/providers/ProviderLogoUploader'
import {
  createEmptyProviderDraft,
  getCurrentProviderProfile,
  listProviderCategories,
  saveLogoForProvider,
  saveProviderProfile,
} from '../features/providers/api'
import type {
  CurrentProviderProfile,
  ProviderCategory,
  ProviderProfileDraft,
} from '../features/providers/types'

type FeedbackState = {
  kind: 'error'
  message: string
} | null

export function AppProviderEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ProviderProfileDraft>(createEmptyProviderDraft())
  const [provider, setProvider] = useState<CurrentProviderProfile | null>(null)
  const [categories, setCategories] = useState<ProviderCategory[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    void Promise.all([getCurrentProviderProfile(user), listProviderCategories()])
      .then(([nextProvider, nextCategories]) => {
        setCategories(nextCategories)
        setProvider(nextProvider)

        if (nextProvider) {
          setDraft({
            companyName: nextProvider.companyName,
            categoryId: nextProvider.categoryId,
            countries: nextProvider.countries,
            description: nextProvider.description,
            brands: nextProvider.brands,
            productsServices: nextProvider.productsServices,
            website: nextProvider.website,
            contactEmail: nextProvider.contactEmail,
          })
        }
      })
      .catch((error) =>
        setFeedback({
          kind: 'error',
          message: error instanceof Error ? error.message : 'No fue posible cargar el formulario.',
        }),
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
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el perfil.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogoUpload(file: File) {
    if (!provider) {
      return
    }

    setIsUploadingLogo(true)

    try {
      const { path, publicUrl } = await saveLogoForProvider(currentUser, file, provider.logoPath)
      setProvider((current) =>
        current ? { ...current, logoUrl: publicUrl, logoPath: path } : current,
      )
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <div className="stack">
    <Breadcrumbs items={[
      { label: 'Panel', to: '/app' },
      { label: 'Perfil comercial', to: '/app/provider' },
      { label: 'Editar' },
    ]} />
    <section className="content-card stack">
      <p className="eyebrow">Proveedor</p>
      <h2>Editar perfil comercial</h2>
      <p>Actualiza la información base que verá el público cuando el perfil esté activo.</p>
      {feedback ? <p className="error-text">{feedback.message}</p> : null}
      {provider ? (
        <ProviderLogoUploader
          companyName={provider.companyName || draft.companyName || 'Proveedor'}
          currentLogoUrl={provider.logoUrl}
          isSubmitting={isUploadingLogo}
          onUpload={handleLogoUpload}
        />
      ) : (
        <p className="helper-text">
          Guarda tu perfil comercial para poder subir el logo de tu empresa.
        </p>
      )}
      <ProviderProfileForm
        categories={categories}
        draft={draft}
        isSaving={isSaving}
        onChange={setDraft}
        onSubmit={handleSave}
        onSubmitLabel="Guardar perfil comercial"
      />
    </section>
    </div>
  )
}
