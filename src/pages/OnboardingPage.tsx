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
import { isProfileComplete } from '../features/profile/profile-status'
import { useCurrentProfile } from '../features/profile/useCurrentProfile'
import type { ProfileDraftInput, ProfileSpecialty } from '../features/profile/types'
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
        <p className="eyebrow">Proveedor</p>
        <h2>Activación comercial próxima</h2>
        <p>
          El flujo de proveedor queda registrado, pero en Semana 5 priorizamos el perfil técnico.
        </p>
        <div className="actions">
          <Link className="button" to="/app/profile">
            Ir a mi perfil
          </Link>
          <Link className="button button--secondary" to="/app">
            Volver al panel
          </Link>
        </div>
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
