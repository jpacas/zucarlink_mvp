import { useEffect, useMemo, useState } from 'react'

import { DirectoryProfileCard } from '../features/directory/DirectoryProfileCard'
import { searchDirectoryProfiles } from '../features/directory/api'
import type { DirectoryFilters, DirectoryProfileCard as DirectoryProfileCardData } from '../features/directory/types'

const emptyFilters: DirectoryFilters = {
  searchText: '',
  country: '',
  specialty: '',
}

const searchDebounceMs = 300

function toSpecialtySlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

export function AppDirectoryPage() {
  const [filters, setFilters] = useState<DirectoryFilters>(emptyFilters)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState('')
  const [allProfiles, setAllProfiles] = useState<DirectoryProfileCardData[]>([])
  const [profiles, setProfiles] = useState<DirectoryProfileCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchInput)
      setFilters((current) =>
        current.searchText === searchInput
          ? current
          : {
              ...current,
              searchText: searchInput,
            },
      )
    }, searchDebounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput])

  useEffect(() => {
    let isMounted = true

    void searchDirectoryProfiles()
      .then((rows) => {
        if (isMounted) {
          setAllProfiles(rows)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar el directorio.',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    void searchDirectoryProfiles({
      searchText: debouncedSearchText,
      country: filters.country,
      specialty: filters.specialty ? toSpecialtySlug(filters.specialty) : '',
    })
      .then((rows) => {
        if (isMounted) {
          setProfiles(rows)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar resultados.',
          )
          setProfiles([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearchText, filters.country, filters.specialty, retryToken])

  const countries = useMemo(
    () =>
      [...new Set(allProfiles.map((profile) => profile.country).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [allProfiles],
  )
  const specialties = useMemo(
    () =>
      [
        ...new Set(
          allProfiles.flatMap((profile) => profile.specialties).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, 'es')),
    [allProfiles],
  )

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Área privada</p>
          <h2>Directorio técnico</h2>
          <p>
            Descubre perfiles completos, filtra por país y especialidad, y navega al
            detalle profesional sin exponer contacto sensible.
          </p>
        </div>
        <span className="route-chip">miembros autenticados</span>
      </div>

      <div className="directory-toolbar">
        <div className="field">
          <label htmlFor="directory-search">Buscar perfiles</label>
          <input
            id="directory-search"
            type="search"
            placeholder="Nombre, empresa o especialidad"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="directory-country">País</label>
          <select
            id="directory-country"
            value={filters.country}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                country: event.target.value,
              }))
            }
          >
            <option value="">Todos</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="directory-specialty">Especialidad</label>
          <select
            id="directory-specialty"
            value={filters.specialty}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                specialty: event.target.value,
              }))
            }
          >
            <option value="">Todas</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage ? (
        <div className="stack stack--compact">
          <p className="error-text">{errorMessage}</p>
          <div className="actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setRetryToken((current) => current + 1)}
            >
              Reintentar búsqueda
            </button>
          </div>
        </div>
      ) : null}
      {isLoading ? <p className="helper-text">Cargando perfiles del directorio...</p> : null}

      {!isLoading && !errorMessage && profiles.length === 0 ? (
        <section className="directory-empty">
          <h3>Sin resultados</h3>
          <p className="helper-text">
            Ajusta búsqueda o filtros para encontrar otro perfil técnico.
          </p>
        </section>
      ) : null}

      <div className="directory-grid" data-testid="directory-results">
        {profiles.map((profile) => (
          <DirectoryProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </section>
  )
}
