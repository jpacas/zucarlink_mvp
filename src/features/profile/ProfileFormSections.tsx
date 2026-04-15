import { useRef, useState } from 'react'

import type {
  ExperienceInput,
  ProfileDraftInput,
  ProfileExperience,
  ProfileSpecialty,
} from './types'

interface ProfileBasicsFieldsProps {
  values: ProfileDraftInput
  onChange: (field: keyof ProfileDraftInput, value: string | number | null) => void
}

export function ProfileBasicsFields({
  values,
  onChange,
}: ProfileBasicsFieldsProps) {
  return (
    <div className="profile-grid">
      <div className="field">
        <label htmlFor="profile-full-name">Nombre completo</label>
        <input
          id="profile-full-name"
          type="text"
          value={values.fullName}
          onChange={(event) => onChange('fullName', event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="profile-country">País</label>
        <input
          id="profile-country"
          type="text"
          value={values.country}
          onChange={(event) => onChange('country', event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="profile-role">Cargo actual</label>
        <input
          id="profile-role"
          type="text"
          value={values.roleTitle}
          onChange={(event) => onChange('roleTitle', event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="profile-company">Empresa / Ingenio</label>
        <input
          id="profile-company"
          type="text"
          value={values.companyName}
          onChange={(event) => onChange('companyName', event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="profile-years">Años de experiencia</label>
        <input
          id="profile-years"
          type="number"
          min="0"
          value={values.yearsExperience ?? ''}
          onChange={(event) =>
            onChange(
              'yearsExperience',
              event.target.value === '' ? null : Number(event.target.value),
            )
          }
          required
        />
      </div>
      <div className="field field--full">
        <label htmlFor="profile-summary">Resumen profesional</label>
        <textarea
          id="profile-summary"
          rows={5}
          value={values.shortBio}
          onChange={(event) => onChange('shortBio', event.target.value)}
          required
        />
      </div>
    </div>
  )
}

export function ContactFields({
  values,
  onChange,
}: ProfileBasicsFieldsProps) {
  return (
    <div className="profile-grid">
      <div className="field">
        <label htmlFor="profile-phone">Teléfono</label>
        <input
          id="profile-phone"
          type="text"
          value={values.phone}
          onChange={(event) => onChange('phone', event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="profile-whatsapp">WhatsApp</label>
        <input
          id="profile-whatsapp"
          type="text"
          value={values.whatsapp}
          onChange={(event) => onChange('whatsapp', event.target.value)}
        />
      </div>
      <div className="field field--full">
        <label htmlFor="profile-linkedin">LinkedIn</label>
        <input
          id="profile-linkedin"
          type="url"
          placeholder="https://linkedin.com/in/..."
          value={values.linkedinUrl}
          onChange={(event) => onChange('linkedinUrl', event.target.value)}
        />
      </div>
    </div>
  )
}

interface SpecialtySelectorProps {
  options: ProfileSpecialty[]
  selectedIds: string[]
  onToggle: (specialtyId: string) => void
}

export function SpecialtySelector({
  options,
  selectedIds,
  onToggle,
}: SpecialtySelectorProps) {
  return (
    <div className="chip-grid" role="group" aria-label="Especialidades técnicas">
      {options.map((option) => {
        const checked = selectedIds.includes(option.id)

        return (
          <label
            key={option.id}
            className={checked ? 'chip chip--active' : 'chip'}
            htmlFor={`specialty-${option.id}`}
          >
            <input
              id={`specialty-${option.id}`}
              className="sr-only"
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.id)}
            />
            {option.name}
          </label>
        )
      })}
    </div>
  )
}

interface AvatarUploaderProps {
  currentUrl: string | null
  currentName: string
  isSubmitting: boolean
  onUpload: (file: File) => Promise<void>
}

export function AvatarUploader({
  currentUrl,
  currentName,
  isSubmitting,
  onUpload,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFeedback(null)

    try {
      await onUpload(file)
      setFeedback('Foto actualizada.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible subir la foto.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="avatar-card">
      {currentUrl ? (
        <img className="avatar-image" src={currentUrl} alt={currentName} />
      ) : (
        <div className="avatar-fallback" aria-hidden="true">
          {currentName.slice(0, 1).toUpperCase() || 'Z'}
        </div>
      )}
      <div className="stack">
        <div>
          <h3>Foto de perfil</h3>
          <p className="helper-text">
            Opcional en onboarding. Formatos permitidos: JPEG, PNG y WEBP.
          </p>
        </div>
        <div className="actions">
          <button
            className="button button--secondary"
            type="button"
            disabled={isSubmitting}
            onClick={() => inputRef.current?.click()}
          >
            {isSubmitting ? 'Subiendo...' : 'Subir foto'}
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          {feedback ? <span className="helper-text">{feedback}</span> : null}
        </div>
      </div>
    </div>
  )
}

const emptyExperience: ExperienceInput = {
  companyName: '',
  roleTitle: '',
  startDate: '',
  endDate: null,
  isCurrent: false,
  description: '',
  achievements: '',
}

interface ExperienceEditorProps {
  experiences: ProfileExperience[]
  isSubmitting: boolean
  onDelete: (experienceId: string) => Promise<void>
  onSave: (payload: ExperienceInput) => Promise<void>
}

export function ExperienceEditor({
  experiences,
  isSubmitting,
  onDelete,
  onSave,
}: ExperienceEditorProps) {
  const [draft, setDraft] = useState<ExperienceInput>(emptyExperience)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function setField<K extends keyof ExperienceInput>(field: K, value: ExperienceInput[K]) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function editExperience(experience: ProfileExperience) {
    setDraft({
      id: experience.id,
      companyName: experience.companyName,
      roleTitle: experience.roleTitle,
      startDate: experience.startDate,
      endDate: experience.endDate,
      isCurrent: experience.isCurrent,
      description: experience.description,
      achievements: experience.achievements,
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (!draft.companyName.trim() || !draft.roleTitle.trim() || !draft.startDate) {
      setErrorMessage('Empresa, cargo y fecha de inicio son obligatorios.')
      return
    }

    if (!draft.isCurrent && !draft.endDate) {
      setErrorMessage('Define una fecha de cierre o marca la experiencia como actual.')
      return
    }

    await onSave(draft)
    setDraft(emptyExperience)
  }

  return (
    <div className="stack">
      <div className="stack">
        {experiences.length > 0 ? (
          experiences.map((experience) => (
            <article key={experience.id} className="info-card">
              <div className="split-header">
                <div className="stack">
                  <strong>{experience.roleTitle}</strong>
                  <span>{experience.companyName}</span>
                </div>
                <div className="actions">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => editExperience(experience)}
                  >
                    Editar
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void onDelete(experience.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <p className="helper-text">
                {experience.startDate} · {experience.isCurrent ? 'Actual' : experience.endDate}
              </p>
              {experience.description ? <p>{experience.description}</p> : null}
              {experience.achievements ? (
                <p className="helper-text">Logros: {experience.achievements}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="helper-text">Todavía no has agregado experiencias.</p>
        )}
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="profile-grid">
          <div className="field">
            <label htmlFor="experience-company">Empresa</label>
            <input
              id="experience-company"
              type="text"
              value={draft.companyName}
              onChange={(event) => setField('companyName', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="experience-role">Cargo</label>
            <input
              id="experience-role"
              type="text"
              value={draft.roleTitle}
              onChange={(event) => setField('roleTitle', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="experience-start">Inicio</label>
            <input
              id="experience-start"
              type="date"
              value={draft.startDate}
              onChange={(event) => setField('startDate', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="experience-end">Fin</label>
            <input
              id="experience-end"
              type="date"
              value={draft.endDate ?? ''}
              disabled={draft.isCurrent}
              onChange={(event) =>
                setField('endDate', event.target.value === '' ? null : event.target.value)
              }
            />
          </div>
          <label className="checkbox-row" htmlFor="experience-current">
            <input
              id="experience-current"
              type="checkbox"
              checked={draft.isCurrent}
              onChange={(event) => setField('isCurrent', event.target.checked)}
            />
            Experiencia actual
          </label>
          <div className="field field--full">
            <label htmlFor="experience-description">Descripción</label>
            <textarea
              id="experience-description"
              rows={4}
              value={draft.description}
              onChange={(event) => setField('description', event.target.value)}
            />
          </div>
          <div className="field field--full">
            <label htmlFor="experience-achievements">Logros</label>
            <textarea
              id="experience-achievements"
              rows={3}
              value={draft.achievements}
              onChange={(event) => setField('achievements', event.target.value)}
            />
          </div>
        </div>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        <div className="actions">
          <button className="button" type="submit" disabled={isSubmitting}>
            {draft.id ? 'Guardar cambios' : 'Agregar experiencia'}
          </button>
          {draft.id ? (
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setDraft(emptyExperience)}
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
