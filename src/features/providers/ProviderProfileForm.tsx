import { useState } from 'react'

import { TagInput } from '../../components/TagInput'
import { fetchSiteMeta } from './api'
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
// Longitud del resumen que aparece en las tarjetas del directorio (buildExcerpt).
const CARD_EXCERPT_LENGTH = 160

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

  if (!draft.description.trim()) {
    errors.description = 'Agrega una descripción de tu empresa.'
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
  const [isFetchingSite, setIsFetchingSite] = useState(false)
  const [siteMessage, setSiteMessage] = useState<string | null>(null)
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

  async function handleFetchSite() {
    const url = draft.website.trim()
    setSiteMessage(null)

    if (!url || !isValidUrl(url)) {
      setErrors((current) => ({
        ...current,
        website: 'Ingresa una URL válida (incluye https://) para traer datos.',
      }))
      return
    }

    setIsFetchingSite(true)
    try {
      const meta = await fetchSiteMeta(url)
      // Solo prellenamos lo que está vacío: nunca pisamos lo que el proveedor ya escribió.
      const hadEmptyTargets = !draft.companyName.trim() || !draft.description.trim()
      const next = { ...draft }
      let filled = false
      if (!next.companyName.trim() && meta.title) {
        next.companyName = meta.title
        filled = true
      }
      if (!next.description.trim() && meta.description) {
        next.description = meta.description
        filled = true
      }

      if (filled) {
        onChange(next)
        setSiteMessage('Prellenamos lo que encontramos en tu sitio. Revísalo y ajústalo.')
      } else if (hadEmptyTargets) {
        // Había campos por llenar pero el sitio no devolvió datos aprovechables.
        setSiteMessage('No encontramos datos aprovechables en tu sitio. Complétalos manualmente.')
      } else {
        setSiteMessage('Leímos tu sitio, pero ya tenías esos campos completos.')
      }
    } catch (error) {
      setSiteMessage(
        error instanceof Error ? error.message : 'No fue posible leer el sitio.',
      )
    } finally {
      setIsFetchingSite(false)
    }
  }

  function handleSubmit() {
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    void onSubmit()
  }

  const descriptionLength = draft.description.trim().length

  return (
    <div className="stack provider-form">
      <section className="stack stack--compact">
        <h3 className="form-section-title">Tu empresa</h3>
        <div className="grid-two">
          <div className="field">
            <div className="field-heading">
              <label htmlFor="provider-company-name">Empresa</label>
              <span className="field-required" aria-hidden="true">obligatorio</span>
            </div>
            <input
              id="provider-company-name"
              type="text"
              required
              value={draft.companyName}
              aria-invalid={Boolean(errors.companyName)}
              placeholder="Ej. Tecno Control S.A. de C.V."
              onChange={(event) => update('companyName', event.target.value)}
            />
            {errors.companyName ? <p className="error-text">{errors.companyName}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="provider-website">Sitio web</label>
            <div className="input-with-action">
              <input
                id="provider-website"
                type="url"
                value={draft.website}
                aria-invalid={Boolean(errors.website)}
                placeholder="https://tuempresa.com"
                onChange={(event) => update('website', event.target.value)}
              />
              <button
                className="button button--secondary button--sm"
                type="button"
                disabled={isFetchingSite || isSaving}
                onClick={() => void handleFetchSite()}
              >
                {isFetchingSite ? 'Leyendo…' : 'Traer datos del sitio'}
              </button>
            </div>
            {errors.website ? <p className="error-text">{errors.website}</p> : null}
            {siteMessage ? <p className="helper-text">{siteMessage}</p> : null}
          </div>
        </div>
      </section>

      <section className="stack stack--compact">
        <h3 className="form-section-title">Qué ofreces</h3>
        <div className="field">
          <div className="field-heading">
            <label htmlFor="provider-category">Categoría</label>
            <span className="field-required" aria-hidden="true">obligatorio</span>
          </div>
          <select
            id="provider-category"
            required
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

        <div className="field">
          <label htmlFor="provider-brands">Marcas que ofrece</label>
          <TagInput
            id="provider-brands"
            value={draft.brands}
            onChange={(value) => update('brands', value)}
            placeholder="Ej. Siemens, Allen-Bradley… (Enter para agregar)"
            ariaLabel="Marcas que ofrece"
          />
          <p className="helper-text">
            Marcas que fabricas o representas. Ayudan a que un técnico te encuentre al buscar
            por marca.
          </p>
        </div>

        <div className="field">
          <label htmlFor="provider-products-services">Productos y servicios</label>
          <TagInput
            id="provider-products-services"
            value={draft.productsServices}
            onChange={(value) => update('productsServices', value)}
            placeholder="Ej. PLC, instrumentación, laboratorio… (Enter para agregar)"
            ariaLabel="Productos y servicios"
          />
        </div>

        <div className="field">
          <div className="field-heading">
            <label htmlFor="provider-description">Descripción</label>
            <span className="field-required" aria-hidden="true">obligatorio</span>
          </div>
          <textarea
            id="provider-description"
            required
            value={draft.description}
            aria-invalid={Boolean(errors.description)}
            onChange={(event) => update('description', event.target.value)}
            rows={5}
            placeholder="Cuenta qué hace tu empresa, a qué ingenios sirve y qué la diferencia."
          />
          <div className="field-meta">
            <span className="helper-text">
              Las primeras {CARD_EXCERPT_LENGTH} letras aparecen como resumen en el directorio.
            </span>
            <span className="char-counter">{descriptionLength} caracteres</span>
          </div>
          {errors.description ? <p className="error-text">{errors.description}</p> : null}
        </div>
      </section>

      <section className="stack stack--compact">
        <h3 className="form-section-title">Cobertura</h3>
        <fieldset className="field">
          <legend>
            Países donde opera
            <span className="field-required" aria-hidden="true"> · obligatorio</span>
          </legend>
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
      </section>

      <section className="stack stack--compact">
        <h3 className="form-section-title">Contacto</h3>
        <div className="field">
          <label htmlFor="provider-contact-email">Email de contacto</label>
          <input
            id="provider-contact-email"
            type="email"
            value={draft.contactEmail}
            aria-invalid={Boolean(errors.contactEmail)}
            placeholder="contacto@tuempresa.com"
            onChange={(event) => update('contactEmail', event.target.value)}
          />
          {errors.contactEmail ? <p className="error-text">{errors.contactEmail}</p> : null}
        </div>
      </section>

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
