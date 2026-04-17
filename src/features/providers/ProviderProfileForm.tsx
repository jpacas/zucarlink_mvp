import type { ProviderCategory, ProviderProfileDraft } from './types'

interface ProviderProfileFormProps {
  categories: ProviderCategory[]
  draft: ProviderProfileDraft
  isSaving: boolean
  onChange: (nextDraft: ProviderProfileDraft) => void
  onSubmitLabel: string
  onSubmit: () => Promise<void> | void
}

export function ProviderProfileForm({
  categories,
  draft,
  isSaving,
  onChange,
  onSubmitLabel,
  onSubmit,
}: ProviderProfileFormProps) {
  function update<K extends keyof ProviderProfileDraft>(field: K, value: ProviderProfileDraft[K]) {
    onChange({
      ...draft,
      [field]: value,
    })
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
            onChange={(event) => update('companyName', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="provider-category">Categoría</label>
          <select
            id="provider-category"
            value={draft.categoryId}
            onChange={(event) => update('categoryId', event.target.value)}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-two">
        <div className="field">
          <label htmlFor="provider-countries">Países donde opera</label>
          <input
            id="provider-countries"
            type="text"
            value={draft.countries}
            onChange={(event) => update('countries', event.target.value)}
            placeholder="El Salvador, Guatemala"
          />
        </div>
        <div className="field">
          <label htmlFor="provider-contact-email">Email de contacto</label>
          <input
            id="provider-contact-email"
            type="email"
            value={draft.contactEmail}
            onChange={(event) => update('contactEmail', event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="provider-short-description">Descripción corta</label>
        <textarea
          id="provider-short-description"
          value={draft.shortDescription}
          onChange={(event) => update('shortDescription', event.target.value)}
          rows={3}
        />
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
            onChange={(event) => update('website', event.target.value)}
          />
        </div>
      </div>

      <div className="actions">
        <button className="button" type="button" disabled={isSaving} onClick={() => void onSubmit()}>
          {isSaving ? 'Guardando...' : onSubmitLabel}
        </button>
      </div>
    </div>
  )
}
