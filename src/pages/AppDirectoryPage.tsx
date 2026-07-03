import { useEffect, useMemo, useState } from 'react'

import { DirectoryProfileCard } from '../features/directory/DirectoryProfileCard'
import { searchDirectoryProfiles } from '../features/directory/api'
import type { DirectoryFilters, DirectoryProfileCard as DirectoryProfileCardData } from '../features/directory/types'
import { SkeletonCard } from '../components/Skeleton'

const emptyFilters: DirectoryFilters = {
  searchText: '',
  country: '',
  specialty: '',
}

const searchDebounceMs = 300
const PAGE_SIZE = 30

function toSpecialtySlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

export function AppDirectoryPage() {
  const [filters, setFilters] = useState<DirectoryFilters>({ ...emptyFilters })
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState('')
  const [allProfiles, setAllProfiles] = useState<DirectoryProfileCardData[]>([])
  const [allProfilesErrorMessage, setAllProfilesErrorMessage] = useState<string | null>(null)

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

  const [profiles, setProfiles] = useState<DirectoryProfileCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    let isMounted = true

    // Solo se usa para poblar los selects de país/especialidad; se pide el máximo
    // permitido por la RPC (200) en vez de la página estándar de resultados.
    void searchDirectoryProfiles(undefined, { limit: 200 })
      .then((rows) => {
        if (isMounted) {
          setAllProfiles(rows)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setAllProfilesErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar el directorio.',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const searchFilters = useMemo(
    () => ({
      searchText: debouncedSearchText,
      country: filters.country,
      specialty: filters.specialty ? toSpecialtySlug(filters.specialty) : '',
    }),
    [debouncedSearchText, filters.country, filters.specialty],
  )

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setSearchErrorMessage(null)

    void searchDirectoryProfiles(searchFilters, { limit: PAGE_SIZE, offset: 0 })
      .then((rows) => {
        if (!isMounted) return
        setProfiles(rows)
        setHasMore(rows.length === PAGE_SIZE)
        setHasSearched(true)
      })
      .catch((error) => {
        if (!isMounted) return
        setSearchErrorMessage(
          error instanceof Error ? error.message : 'No fue posible cargar el directorio.',
        )
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [searchFilters])

  const retrySearch = () => {
    setIsLoading(true)
    setSearchErrorMessage(null)

    void searchDirectoryProfiles(searchFilters, { limit: PAGE_SIZE, offset: 0 })
      .then((rows) => {
        setProfiles(rows)
        setHasMore(rows.length === PAGE_SIZE)
        setHasSearched(true)
      })
      .catch((error) =>
        setSearchErrorMessage(
          error instanceof Error ? error.message : 'No fue posible cargar el directorio.',
        ),
      )
      .finally(() => setIsLoading(false))
  }

  const loadMore = () => {
    setIsLoadingMore(true)
    void searchDirectoryProfiles(searchFilters, { limit: PAGE_SIZE, offset: profiles.length })
      .then((rows) => {
        setProfiles((current) => [...current, ...rows])
        setHasMore(rows.length === PAGE_SIZE)
      })
      .catch((error) =>
        setSearchErrorMessage(
          error instanceof Error ? error.message : 'No fue posible cargar el directorio.',
        ),
      )
      .finally(() => setIsLoadingMore(false))
  }

  const errorMessage = searchErrorMessage ?? (hasSearched ? null : allProfilesErrorMessage)

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
              className="button button--ghost"
              onClick={retrySearch}
            >
              Reintentar búsqueda
            </button>
          </div>
        </div>
      ) : null}
      {isLoading ? (
        <div className="directory-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : null}

      {!isLoading && !errorMessage && profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 14l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>Sin resultados</h3>
          <p>Ajusta búsqueda o filtros para encontrar otro perfil técnico.</p>
        </div>
      ) : null}

      <div className="directory-grid" data-testid="directory-results">
        {profiles.map((profile) => (
          <DirectoryProfileCard key={profile.id} profile={profile} />
        ))}
      </div>

      {hasMore ? (
        <div className="actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Cargando…' : 'Mostrar más'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
