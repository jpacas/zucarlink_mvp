import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAuth } from '../features/auth/AuthProvider'
import { getDirectoryPublicSummary } from '../features/directory/api'
import type { DirectoryAggregateSnapshot } from '../features/directory/types'

const emptySummary: DirectoryAggregateSnapshot = {
  totalMembers: 0,
  totalCountries: 0,
  totalCompanies: 0,
  totalSpecialties: 0,
}

const summaryCards = [
  {
    key: 'totalMembers',
    label: 'Miembros visibles',
    description: 'Perfiles técnicos completos listos para descubrimiento privado.',
  },
  {
    key: 'totalCountries',
    label: 'Países activos',
    description: 'Presencia regional actual dentro de la red.',
  },
  {
    key: 'totalCompanies',
    label: 'Ingenios y empresas',
    description: 'Organizaciones representadas con perfiles completos.',
  },
  {
    key: 'totalSpecialties',
    label: 'Especialidades',
    description: 'Áreas técnicas visibles para explorar después de iniciar sesión.',
  },
] satisfies Array<{
  key: keyof DirectoryAggregateSnapshot
  label: string
  description: string
}>

export function DirectoryPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DirectoryAggregateSnapshot>(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let isMounted = true

    void getDirectoryPublicSummary()
      .then((nextSummary) => {
        if (isMounted) {
          setSummary(nextSummary)
          setErrorMessage(null)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar el resumen del directorio.',
          )
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
  }, [retryToken])

  return (
    <div className="stack">
      <section className="hero-card stack">
        <p className="eyebrow">Directorio público</p>
        <h2>Directorio de la industria azucarera</h2>
        <p>
          Muestra presencia sectorial y masa crítica sin exponer información sensible.
          El descubrimiento completo queda dentro del área autenticada.
        </p>
        <div className="actions">
          {user ? (
            <Link className="button" to="/app/directory">
              Abrir directorio privado
            </Link>
          ) : (
            <Link className="button" to="/register">
              Crear cuenta para explorar perfiles
            </Link>
          )}
          <Link className="button button--secondary" to={user ? '/app' : '/login'}>
            {user ? 'Volver al panel' : 'Ingresar'}
          </Link>
        </div>
      </section>

      <section className="section-grid section-grid--directory">
        {summaryCards.map((card) => (
          <article key={card.key} className="content-card stack">
            <p className="eyebrow">{card.label}</p>
            <h3 className="metric-value">
              {isLoading ? '...' : summary[card.key].toLocaleString('es-SV')}
            </h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Privacidad primero</p>
            <h3>Qué se ve aquí y qué queda dentro</h3>
          </div>
          <span className="route-chip">público agregado</span>
        </div>
        <ul className="list">
          <li>Señales de presencia: miembros, países, empresas y especialidades.</li>
          <li>No se muestran emails, teléfonos, WhatsApp ni fichas individuales.</li>
          <li>El detalle profesional útil requiere sesión activa.</li>
        </ul>
        {errorMessage ? (
          <div className="stack stack--compact">
            <p className="error-text">{errorMessage}</p>
            <div className="actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setRetryToken((current) => current + 1)}
              >
                Reintentar resumen
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
