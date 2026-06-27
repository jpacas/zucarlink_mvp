import { useState } from 'react'

import { PROVIDER_COUNTRIES } from './countries'
import type { ProviderCategory, ProviderProfileDraft } from './types'

interface ProviderProfileFormProps {
  categories: ProviderCategory[]
  draft: ProviderProfileDraft
  isSaving: boolean
  onChange: (nextDraft: ProviderProfileDraft) => void
  onSubmitLabel: string
  onSubmit: () => Promise<void> | void
}

type FieldErrors = Partial<Record<keyof ProviderProfileDraft, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseCountries(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateDraft(draft: ProviderProfileDraft): FieldErrors {
  const errors: FieldErrors = {}

  if (!draft.companyName.trim()) {
    errors.companyName = 'Ingresa el nombre de la empresa.'
  }

  if (!draft.categoryId) {
    errors.categoryId = 'Selecciona una categoría.'
  }

  if (parseCountries(draft.countries).length === 0) {
    errors.countries = 'Selecciona al menos un país.'
  }

  if (!draft.shortDescription.trim()) {
    errors.shortDescription = 'Agrega una descripción corta.'
  }

  if (draft.contactEmail.trim() && !EMAIL_PATTERN.test(draft.contactEmail.trim())) {
    errors.contactEmail = 'Ingresa un email válido.'
  }

  if (draft.website.trim() && !isValidUrl(draft.website.trim())) {
    errors.website = 'Ingresa una URL válida (incluye https://).'
  }

  return errors
}

export function ProviderProfileForm({
  categories,
  draft,
  isSaving,
  onChange,
  onSubmitLabel,
  onSubmit,
}: ProviderProfileFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const selectedCountries = parseCountries(draft.countries)

  function update<K extends keyof ProviderProfileDraft>(field: K, value: ProviderProfileDraft[K]) {
    // Limpiamos el error del campo en cuanto el usuario lo corrige.
    setErrors((current) => {
      if (!current[field]) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })

    onChange({
      ...draft,
      [field]: value,
    })
  }

  function toggleCountry(country: string) {
    const next = selectedCountries.includes(country)
      ? selectedCountries.filter((item) => item !== country)
      : [...selectedCountries, country]

    update('countries', next.join(', '))
  }

  function handleSubmit() {
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    void onSubmit()
  }

  return (
    <div className="stack">
      <div className="grid-two">
        <div className="field">
          <label htmlFor="provider-company-name">Empresa</label>
          <input
            id="provider-company-name"
            type="text"
            value={draft.companyName}
            aria-invalid={Boolean(errors.companyName)}
            onChange={(event) => update('companyName', event.target.value)}
          />
          {errors.companyName ? <p className="error-text">{errors.companyName}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="provider-category">Categoría</label>
          <select
            id="provider-category"
            value={draft.categoryId}
            aria-invalid={Boolean(errors.categoryId)}
            onChange={(event) => update('categoryId', event.target.value)}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <p className="error-text">{errors.categoryId}</p> : null}
        </div>
      </div>

      <div className="grid-two">
        <fieldset className="field">
          <legend>Países donde opera</legend>
          <div className="chip-grid">
            {PROVIDER_COUNTRIES.map((countryName) => {
              const checked = selectedCountries.includes(countryName)
              return (
                <label
                  key={countryName}
                  className={checked ? 'chip chip--active' : 'chip'}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleCountry(countryName)}
                  />
                  {countryName}
                </label>
              )
            })}
          </div>
          {errors.countries ? <p className="error-text">{errors.countries}</p> : null}
        </fieldset>
        <div className="field">
          <label htmlFor="provider-contact-email">Email de contacto</label>
          <input
            id="provider-contact-email"
            type="email"
            value={draft.contactEmail}
            aria-invalid={Boolean(errors.contactEmail)}
            onChange={(event) => update('contactEmail', event.target.value)}
          />
          {errors.contactEmail ? <p className="error-text">{errors.contactEmail}</p> : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="provider-short-description">Descripción corta</label>
        <textarea
          id="provider-short-description"
          value={draft.shortDescription}
          aria-invalid={Boolean(errors.shortDescription)}
          onChange={(event) => update('shortDescription', event.target.value)}
          rows={3}
        />
        {errors.shortDescription ? <p className="error-text">{errors.shortDescription}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="provider-long-description">Descripción ampliada</label>
        <textarea
          id="provider-long-description"
          value={draft.longDescription}
          onChange={(event) => update('longDescription', event.target.value)}
          rows={5}
        />
      </div>

      <div className="grid-two">
        <div className="field">
          <label htmlFor="provider-products-services">Productos y servicios</label>
          <input
            id="provider-products-services"
            type="text"
            value={draft.productsServices}
            onChange={(event) => update('productsServices', event.target.value)}
            placeholder="PLC, instrumentación, laboratorio"
          />
        </div>
        <div className="field">
          <label htmlFor="provider-website">Sitio web</label>
          <input
            id="provider-website"
            type="url"
            value={draft.website}
            aria-invalid={Boolean(errors.website)}
            onChange={(event) => update('website', event.target.value)}
          />
          {errors.website ? <p className="error-text">{errors.website}</p> : null}
        </div>
      </div>

      <div className="actions">
        <button
          className="button"
          type="button"
          disabled={isSaving}
          onClick={handleSubmit}
        >
          {isSaving ? 'Guardando...' : onSubmitLabel}
        </button>
      </div>
    </div>
  )
}
