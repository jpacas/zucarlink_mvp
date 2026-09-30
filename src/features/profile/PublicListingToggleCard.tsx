import { useEffect, useState } from 'react'

import { getMyPublicListingOptOut, updateMyPublicListingOptOut } from './api'

export function PublicListingToggleCard({ userId }: { userId: string }) {
  const [optOut, setOptOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyPublicListingOptOut(userId)
      .then((value) => {
        if (!cancelled) setOptOut(value)
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar tu preferencia.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function handleToggle(value: boolean) {
    const previous = optOut
    setOptOut(value)
    setErrorMessage(null)

    try {
      await updateMyPublicListingOptOut(userId, value)
    } catch (error) {
      setOptOut(previous)
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el cambio.')
    }
  }

  return (
    <article className="info-card stack">
      <h3>Visibilidad</h3>
      <p className="helper-text">
        Tu perfil aparece en el directorio público y en buscadores. Podés sacarlo de ahí sin
        afectar tu visibilidad dentro de la red de técnicos ya registrados.
      </p>

      {isLoading ? (
        <p className="helper-text">Cargando preferencia…</p>
      ) : (
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={optOut}
            onChange={(event) => void handleToggle(event.target.checked)}
          />
          No mostrar mi perfil en el directorio público ni en buscadores
        </label>
      )}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </article>
  )
}
