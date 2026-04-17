import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import {
  AvatarUploader,
  SpecialtySelector,
} from '../features/profile/ProfileFormSections'
import {
  listSpecialties,
  saveAvatarForProfile,
  saveProfileDraft,
} from '../features/profile/api'
import { ProviderProfileForm } from '../features/providers/ProviderProfileForm'
import {
  createEmptyProviderDraft,
  getCurrentProviderProfile,
  isProviderDraftComplete,
  listProviderCategories,
  saveProviderProfile,
} from '../features/providers/api'
import { isProfileComplete } from '../features/profile/profile-status'
import { useCurrentProfile } from '../features/profile/useCurrentProfile'
import type { ProfileDraftInput, ProfileSpecialty } from '../features/profile/types'
import type {
  ProviderCategory,
  ProviderProfileDraft,
} from '../features/providers/types'
import { useAuth } from '../features/auth/AuthProvider'

function createDraft(
  fullName: string,
  profile?: {
    country: string
    roleTitle: string
    companyName: string
    yearsExperience: number | null
    shortBio: string
    phone: string
    whatsapp: string
    linkedinUrl: string
  } | null,
): ProfileDraftInput {
  return {
    fullName,
    country: profile?.country ?? '',
    roleTitle: profile?.roleTitle ?? '',
    companyName: profile?.companyName ?? '',
    yearsExperience: profile?.yearsExperience ?? null,
    shortBio: profile?.shortBio ?? '',
    phone: profile?.phone ?? '',
    whatsapp: profile?.whatsapp ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
  }
}

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { profile, isLoading, errorMessage, reload } = useCurrentProfile(user)
  const [draft, setDraft] = useState<ProfileDraftInput>(() =>
    createDraft(
      (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '',
    ),
  )
  const [specialties, setSpecialties] = useState<ProfileSpecialty[]>([])
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [providerDraft, setProviderDraft] = useState<ProviderProfileDraft>(
    createEmptyProviderDraft(),
  )
  const [providerCategories, setProviderCategories] = useState<ProviderCategory[]>([])

  useEffect(() => {
    void listSpecialties()
      .then(setSpecialties)
      .catch((error) =>
        setFeedback(error instanceof Error ? error.message : 'No fue posible cargar especialidades.'),
      )
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    if (profile?.accountType !== 'provider') {
      return
    }

    void Promise.all([getCurrentProviderProfile(user), listProviderCategories()])
      .then(([providerProfile, categories]) => {
        setProviderCategories(categories)

        if (providerProfile) {
          setProviderDraft({
            companyName: providerProfile.companyName,
            categoryId: providerProfile.categoryId,
            countries: providerProfile.countries,
            shortDescription: providerProfile.shortDescription,
            longDescription: providerProfile.longDescription,
            productsServices: providerProfile.productsServices,
            website: providerProfile.website,
            contactEmail:
              providerProfile.contactEmail || user.email || '',
          })
        } else {
          setProviderDraft((current) => ({
            ...current,
            contactEmail: current.contactEmail || user.email || '',
          }))
        }
      })
      .catch((error) =>
        setFeedback(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar la activación comercial.',
        ),
      )
  }, [profile?.accountType, user])

  useEffect(() => {
    if (!user) {
      return
    }

    if (profile?.accountType === 'provider') {
      setDraft(
        createDraft(
          profile.fullName ||
            ((user.user_metadata?.full_name as string | undefined) ?? user.email ?? ''),
          profile,
        ),
      )
      setAvatarUrl(profile.avatarUrl)
      return
    }

    if (profile) {
      setDraft(createDraft(profile.fullName, profile))
      setSelectedSpecialtyIds(profile.specialties.map((specialty) => specialty.id))
      setAvatarUrl(profile.avatarUrl)

      if (profile.profileStatus === 'complete') {
        navigate('/app/profile', { replace: true })
      }
    }
  }, [navigate, profile, user])

  const canFinish = useMemo(
    () => isProfileComplete(draft, selectedSpecialtyIds.map((id) => ({ id }))),
    [draft, selectedSpecialtyIds],
  )

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const currentUser = user

  async function persistDraft(nextStep?: number) {
    setIsSaving(true)
    setFeedback(null)

    try {
      await saveProfileDraft(currentUser.id, draft, selectedSpecialtyIds)
      await reload()
      if (typeof nextStep === 'number') {
        setStep(nextStep)
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible guardar el avance.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleFinish() {
    if (!canFinish) {
      setFeedback(
        'Completa país, cargo, empresa/ingenio, años de experiencia, resumen y al menos una especialidad.',
      )
      return
    }

    await persistDraft(2)
  }

  async function handleAvatarUpload(file: File) {
    if (!profile) {
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const nextAvatarUrl = await saveAvatarForProfile(
        currentUser.id,
        file,
        profile.avatarPath,
      )
      setAvatarUrl(nextAvatarUrl)
      await reload()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible subir la foto.')
    } finally {
      setIsSaving(false)
    }
  }

  function toggleSpecialty(specialtyId: string) {
    setSelectedSpecialtyIds((current) =>
      current.includes(specialtyId)
        ? current.filter((item) => item !== specialtyId)
        : [...current, specialtyId],
    )
  }

  async function handleProviderSave(nextStep?: number) {
    if (!isProviderDraftComplete(providerDraft)) {
      setFeedback(
        'Completa empresa, categoría, países donde operas y descripción corta.',
      )
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      await saveProviderProfile(currentUser, providerDraft, nextStep === 1 ? 'draft_profile' : 'lead')

      if (typeof nextStep === 'number') {
        setStep(nextStep)
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible guardar el perfil comercial.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !profile) {
    return (
      <section className="content-card stack">
        <h2>Completa tu perfil técnico</h2>
        <p className="helper-text">Cargando perfil...</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="content-card stack">
        <h2>Completa tu perfil técnico</h2>
        <p className="error-text">{errorMessage}</p>
      </section>
    )
  }

  if (profile?.accountType === 'provider') {
    return (
      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Proveedor</p>
            <h2>Activa tu perfil comercial</h2>
            <p>Completa la ficha mínima para dejar lista tu presencia comercial en Zucarlink.</p>
          </div>
          <span className="route-chip">Paso {Math.min(step + 1, 2)} de 2</span>
        </div>

        {step === 0 ? (
          <>
            <ProviderProfileForm
              categories={providerCategories}
              draft={providerDraft}
              isSaving={isSaving}
              onChange={setProviderDraft}
              onSubmit={() => handleProviderSave(1)}
              onSubmitLabel="Continuar"
            />
            {feedback ? <p className="error-text">{feedback}</p> : null}
          </>
        ) : null}

        {step === 1 ? (
          <div className="stack">
            <div className="info-card stack">
              <h3>Solicitud de activación</h3>
              <p>
                Tu perfil comercial ya tiene la base mínima. Al enviar la solicitud quedará listo
                para revisión y activación manual.
              </p>
              <div className="actions">
                <span className="user-badge">{providerDraft.companyName}</span>
                {providerDraft.categoryId ? <span className="user-badge">Categoría definida</span> : null}
              </div>
            </div>
            {feedback ? <p className="error-text">{feedback}</p> : null}
            <div className="actions">
              <button
                className="button button--secondary"
                type="button"
                disabled={isSaving}
                onClick={() => setStep(0)}
              >
                Atrás
              </button>
              <button
                className="button"
                type="button"
                disabled={isSaving}
                onClick={() => void handleProviderSave(2)}
              >
                {isSaving ? 'Enviando...' : 'Solicitar activación'}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="stack">
            <h3>Solicitud enviada</h3>
            <p>
              Tu perfil comercial quedó registrado como lead. Puedes revisarlo o editarlo desde tu
              área privada mientras se activa manualmente.
            </p>
            <div className="actions">
              <Link className="button" to="/app/provider">
                Ver perfil comercial
              </Link>
              <Link className="button button--secondary" to="/app/provider/edit">
                Editar perfil
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Onboarding técnico</p>
          <h2>Completa tu perfil técnico</h2>
          <p>
            Necesitamos unos datos más para preparar tu perfil técnico-profesional.
          </p>
        </div>
        <span className="route-chip">Paso {Math.min(step + 1, 3)} de 3</span>
      </div>

      {step === 0 ? (
        <>
          <AvatarUploader
            currentName={draft.fullName}
            currentUrl={avatarUrl}
            isSubmitting={isSaving}
            onUpload={handleAvatarUpload}
          />
          <div className="profile-grid">
            <div className="field">
              <label htmlFor="onboarding-full-name">Nombre completo</label>
              <input
                id="onboarding-full-name"
                type="text"
                value={draft.fullName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, fullName: event.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="onboarding-country">País</label>
              <input
                id="onboarding-country"
                type="text"
                value={draft.country}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, country: event.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="onboarding-role">Cargo actual</label>
              <input
                id="onboarding-role"
                type="text"
                value={draft.roleTitle}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, roleTitle: event.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="onboarding-company">Empresa / Ingenio</label>
              <input
                id="onboarding-company"
                type="text"
                value={draft.companyName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, companyName: event.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="onboarding-years">Años de experiencia</label>
              <input
                id="onboarding-years"
                type="number"
                min="0"
                value={draft.yearsExperience ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    yearsExperience:
                      event.target.value === '' ? null : Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
          {feedback ? <p className="error-text">{feedback}</p> : null}
          <div className="actions">
            <button
              className="button"
              type="button"
              disabled={isSaving}
              onClick={() => void persistDraft(1)}
            >
              {isSaving ? 'Guardando...' : 'Continuar'}
            </button>
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div className="field">
            <label htmlFor="onboarding-summary">Resumen profesional corto</label>
            <textarea
              id="onboarding-summary"
              rows={6}
              value={draft.shortBio}
              onChange={(event) =>
                setDraft((current) => ({ ...current, shortBio: event.target.value }))
              }
            />
          </div>
          <div className="stack">
            <div>
              <h3>Especialidades técnicas</h3>
              <p className="helper-text">Selecciona al menos una especialidad.</p>
            </div>
            <SpecialtySelector
              options={specialties}
              selectedIds={selectedSpecialtyIds}
              onToggle={toggleSpecialty}
            />
          </div>
          {feedback ? <p className="error-text">{feedback}</p> : null}
          <div className="actions">
            <button
              className="button button--secondary"
              type="button"
              disabled={isSaving}
              onClick={() => setStep(0)}
            >
              Atrás
            </button>
            <button
              className="button"
              type="button"
              disabled={isSaving}
              onClick={() => void handleFinish()}
            >
              {isSaving ? 'Guardando...' : 'Finalizar perfil'}
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <div className="stack">
          <h3>Perfil listo para la siguiente etapa</h3>
          <p>
            Tu perfil ya tiene la base mínima para Semana 5. Puedes revisarlo o ampliar
            contacto y experiencia desde la edición.
          </p>
          <div className="actions">
            <Link className="button" to="/app/profile">
              Ver mi perfil
            </Link>
            <Link className="button button--secondary" to="/app/profile/edit">
              Editar más datos
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  )
}
