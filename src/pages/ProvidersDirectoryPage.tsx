import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  listProviderCategories,
  searchProviders,
} from '../features/providers/api'
import { ProviderLogo } from '../features/providers/ProviderLogo'
import type { ProviderCard, ProviderCategory } from '../features/providers/types'
import { trackEvent } from '../lib/analytics'
import { isPublicConfigurationError } from '../lib/publicFallbacks'
import { Skeleton } from '../components/Skeleton'

export function ProvidersDirectoryPage() {
  const [providers, setProviders] = useState<ProviderCard[]>([])
  const [categories, setCategories] = useState<ProviderCategory[]>([])
  const [searchText, setSearchText] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [country, setCountry] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void listProviderCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setErrorMessage(null)

    void searchProviders({ searchText, categorySlug, country })
      .then((rows) => setProviders(rows))
      .catch((error) =>
        setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar proveedores.'),
      )
      .finally(() => setIsLoading(false))
  }, [categorySlug, country, searchText])

  const countryOptions = useMemo(
    () =>
      [...new Set(providers.flatMap((provider) => provider.countries))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [providers],
  )
  const isPublicDataUnavailable = isPublicConfigurationError(errorMessage)

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Público</p>
          <h2>Directorio de proveedores</h2>
          <p>Explora proveedores activos por categoría y país.</p>
        </div>
      </div>

      <div className="grid-two">
        <div className="field">
          <label htmlFor="providers-search">Buscar</label>
          <input
            id="providers-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="providers-category">Categoría</label>
          <select
            id="providers-category"
            value={categorySlug}
            onChange={(event) => setCategorySlug(event.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="providers-country">País</label>
          <select
            id="providers-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="">Todos</option>
            {countryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="stack" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <article key={i} className="info-card stack">
              <div className="split-header">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Skeleton variant="avatar-sm" />
                  <div className="stack stack--compact">
                    <Skeleton variant="heading" width="160px" />
                    <Skeleton variant="chip" />
                  </div>
                </div>
              </div>
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="65%" />
            </article>
          ))}
        </div>
      ) : null}
      {!isLoading && isPublicDataUnavailable ? (
        <p className="helper-text">El directorio de proveedores estará disponible pronto.</p>
      ) : null}
      {!isLoading && errorMessage && !isPublicDataUnavailable ? (
        <p className="error-text">{errorMessage}</p>
      ) : null}

      <div className="stack" data-testid="providers-results">
        {!isLoading && !errorMessage && providers.length === 0 ? (
          <p className="helper-text">
            No encontramos proveedores con esos filtros. Ajusta tu búsqueda o categoría.
          </p>
        ) : null}
        {providers.map((provider) => (
          <article key={provider.id} className="info-card stack">
            <div className="split-header">
              <div className="provider-summary">
                <ProviderLogo companyName={provider.companyName} logoUrl={provider.logoUrl} size="sm" />
                <div className="stack">
                  <h3>{provider.companyName}</h3>
                  <div className="actions">
                    <span className="user-badge">{provider.category.name}</span>
                    {provider.isVerified ? <span className="user-badge">Verificado</span> : null}
                  </div>
                </div>
              </div>
              <div className="chip-grid">
                {provider.countries.map((item) => (
                  <span key={item} className="chip chip--active">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <p>{provider.shortDescription}</p>
            <div className="actions">
              <Link
                className="button button--secondary"
                to={`/proveedores/${provider.slug}`}
                onClick={() =>
                  trackEvent('provider_card_clicked', { providerSlug: provider.slug })
                }
              >
                Ver perfil de {provider.companyName}
              </Link>
              <Link className="button" to={`/proveedores/${provider.slug}#contacto`}>
                Contactar
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
