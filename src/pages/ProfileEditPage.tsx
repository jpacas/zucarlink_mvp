import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  AvatarUploader,
  ContactFields,
  ExperienceEditor,
  ProfileBasicsFields,
  SpecialtySelector,
} from '../features/profile/ProfileFormSections'
import {
  deleteExperience,
  listSpecialties,
  saveAvatarForProfile,
  saveExperience,
  saveProfileDraft,
} from '../features/profile/api'
import { isProfileComplete } from '../features/profile/profile-status'
import { useCurrentProfile } from '../features/profile/useCurrentProfile'
import type {
  ExperienceInput,
  ProfileDraftInput,
  ProfileSpecialty,
} from '../features/profile/types'
import { useAuth } from '../features/auth/AuthProvider'

type FeedbackState = {
  kind: 'error' | 'success'
  message: string
} | null

function createDraft(profile?: {
  fullName: string
  country: string
  roleTitle: string
  companyName: string
  yearsExperience: number | null
  shortBio: string
  phone: string
  whatsapp: string
  linkedinUrl: string
} | null): ProfileDraftInput {
  return {
    fullName: profile?.fullName ?? '',
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

export function ProfileEditPage() {
  const { user } = useAuth()
  const { profile, isLoading, errorMessage, reload } = useCurrentProfile(user)
  const [draft, setDraft] = useState<ProfileDraftInput>(createDraft())
  const [specialties, setSpecialties] = useState<ProfileSpecialty[]>([])
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initializedProfileIdRef = useRef<string | null>(null)

  useEffect(() => {
    void listSpecialties()
      .then(setSpecialties)
      .catch((error) =>
        setFeedback({
          kind: 'error',
          message: error instanceof Error ? error.message : 'No fue posible cargar especialidades.',
        }),
      )
  }, [])

  useEffect(() => {
    if (!profile) {
      return
    }

    if (initializedProfileIdRef.current === profile.id) {
      return
    }

    setDraft(createDraft(profile))
    setSelectedSpecialtyIds(profile.specialties.map((specialty) => specialty.id))
    initializedProfileIdRef.current = profile.id
  }, [profile])

  const profileComplete = useMemo(
    () => isProfileComplete(draft, selectedSpecialtyIds.map((id) => ({ id }))),
    [draft, selectedSpecialtyIds],
  )

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const currentUser = user

  async function persistProfile() {
    setIsSubmitting(true)
    setFeedback(null)

    try {
      await saveProfileDraft(currentUser.id, draft, selectedSpecialtyIds)
      await reload()
      setFeedback({
        kind: 'success',
        message: profileComplete
          ? 'Perfil actualizado.'
          : 'Perfil guardado. Aún faltan campos clave para completarlo.',
      })
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar el perfil.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!profile) {
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      await saveAvatarForProfile(currentUser.id, file, profile.avatarPath)
      await reload()
      setFeedback({
        kind: 'success',
        message: 'Foto actualizada.',
      })
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible subir la foto.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveExperience(payload: ExperienceInput) {
    setIsSubmitting(true)
    setFeedback(null)

    try {
      await saveExperience(currentUser.id, payload)
      await reload()
      setFeedback({
        kind: 'success',
        message: 'Experiencia actualizada.',
      })
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible guardar la experiencia.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteExperience(experienceId: string) {
    setIsSubmitting(true)
    setFeedback(null)

    try {
      await deleteExperience(currentUser.id, experienceId)
      await reload()
      setFeedback({
        kind: 'success',
        message: 'Experiencia eliminada.',
      })
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'No fue posible eliminar la experiencia.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function setField(field: keyof ProfileDraftInput, value: string | number | null) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function toggleSpecialty(specialtyId: string) {
    setSelectedSpecialtyIds((current) =>
      current.includes(specialtyId)
        ? current.filter((item) => item !== specialtyId)
        : [...current, specialtyId],
    )
  }

  if (profile?.accountType === 'provider') {
    return <Navigate to="/app/provider/edit" replace />
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Edición de perfil</p>
          <h2>Editar perfil técnico</h2>
          <p>Actualiza identidad profesional, especialidades, experiencia y contacto.</p>
        </div>
        <Link className="button button--secondary" to="/app/profile">
          Volver al perfil
        </Link>
      </div>

      {isLoading && !profile ? <p className="helper-text">Cargando perfil...</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {profile ? (
        <>
          <AvatarUploader
            currentName={draft.fullName}
            currentUrl={profile.avatarUrl}
            isSubmitting={isSubmitting}
            onUpload={handleAvatarUpload}
          />

          <div className="stack">
            <h3>Identidad profesional</h3>
            <ProfileBasicsFields values={draft} onChange={setField} />
          </div>

          <div className="stack">
            <h3>Especialidades</h3>
            <SpecialtySelector
              options={specialties}
              selectedIds={selectedSpecialtyIds}
              onToggle={toggleSpecialty}
            />
          </div>

          <div className="stack">
            <h3>Contacto</h3>
            <p className="helper-text">
              Teléfono y WhatsApp quedan ocultos por defecto en la vista del perfil.
            </p>
            <ContactFields values={draft} onChange={setField} />
          </div>

          <div className="stack">
            <h3>Experiencia profesional</h3>
            <ExperienceEditor
              experiences={profile.experiences}
              isSubmitting={isSubmitting}
              onDelete={handleDeleteExperience}
              onSave={handleSaveExperience}
            />
          </div>

          {feedback ? (
            <p className={feedback.kind === 'error' ? 'error-text' : 'status'}>
              {feedback.message}
            </p>
          ) : null}

          <div className="actions">
            <button className="button" type="button" disabled={isSubmitting} onClick={() => void persistProfile()}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <span className="helper-text">
              Estado del perfil: {profileComplete ? 'completo' : 'incompleto'}
            </span>
          </div>
        </>
      ) : null}
    </section>
  )
}
