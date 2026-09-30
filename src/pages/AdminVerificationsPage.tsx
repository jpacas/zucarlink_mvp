import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { isAdminUser } from '../features/auth/roles'
import {
  listVerificationLog,
  searchVerifiableProfiles,
  updateVerification,
} from '../features/admin-verifications/api'
import type {
  VerifiableProfile,
  VerificationLogEntry,
  VerificationStatus,
} from '../features/admin-verifications/types'
import { formatDateTime } from '../lib/date'

const statusLabels: Record<VerificationStatus, string> = {
  unverified: 'Sin verificar',
  pending: 'Pendiente',
  verified: 'Verificado',
}

export function AdminVerificationsPage() {
  const { user } = useAuth()
  const isAdmin = isAdminUser(user)
  const [searchText, setSearchText] = useState('')
  const [profiles, setProfiles] = useState<VerifiableProfile[]>([])
  const [log, setLog] = useState<VerificationLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null)

  async function loadProfiles(query: string) {
    setIsLoading(true)

    try {
      const [rows, logRows] = await Promise.all([
        searchVerifiableProfiles(query),
        listVerificationLog(),
      ])
      setProfiles(rows)
      setLog(logRows)
      setFeedback(null)
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No fue posible cargar los perfiles.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }

    void loadProfiles('')
  }, [isAdmin])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadProfiles(searchText)
  }

  async function handleToggle(profile: VerifiableProfile) {
    const nextStatus = profile.verificationStatus === 'verified' ? 'unverified' : 'verified'
    setPendingProfileId(profile.id)

    try {
      await updateVerification(profile.id, nextStatus)
      await loadProfiles(searchText)
      setFeedback(
        nextStatus === 'verified'
          ? `Verificación otorgada a ${profile.fullName}.`
          : `Verificación revocada a ${profile.fullName}.`,
      )
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No fue posible actualizar la verificación.',
      )
    } finally {
      setPendingProfileId(null)
    }
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Admin</p>
          <h2>Verificación de perfiles</h2>
          <p>
            Otorga o revoca la verificación de un perfil técnico. Cada cambio queda
            registrado con quién lo hizo y cuándo. El badge de "Verificado" sigue oculto en
            la UI pública hasta que se defina el criterio de verificación (T8).
          </p>
        </div>
      </div>

      <form className="directory-toolbar" onSubmit={(event) => void handleSearchSubmit(event)}>
        <div className="field">
          <label htmlFor="admin-verifications-search">Buscar perfiles</label>
          <input
            id="admin-verifications-search"
            type="search"
            placeholder="Nombre o empresa/ingenio"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
        <div className="actions">
          <button className="button button--secondary" type="submit">
            Buscar
          </button>
        </div>
      </form>

      {isLoading ? <p className="helper-text">Cargando…</p> : null}
      {feedback ? (
        <p className={feedback.includes('No fue posible') ? 'error-text' : 'status'}>{feedback}</p>
      ) : null}

      <div className="compact-table">
        {profiles.length === 0 && !isLoading ? (
          <p className="helper-text">Sin resultados.</p>
        ) : null}
        {profiles.map((profile) => (
          <div key={profile.id} className="compact-row compact-row--stack">
            <strong>{profile.fullName}</strong>
            <span>
              {profile.country || 'Sin país'}
              {profile.organizationName ? ` · ${profile.organizationName}` : ''} ·{' '}
              {statusLabels[profile.verificationStatus]}
            </span>
            <div className="actions">
              <button
                className="button button--secondary"
                type="button"
                disabled={pendingProfileId === profile.id}
                onClick={() => void handleToggle(profile)}
              >
                {profile.verificationStatus === 'verified' ? 'Revocar' : 'Otorgar verificación'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="stack">
        <h3>Historial de cambios</h3>
        {log.length === 0 ? <p className="helper-text">Sin cambios registrados todavía.</p> : null}
        <div className="compact-table">
          {log.map((entry) => (
            <div key={entry.id} className="compact-row compact-row--stack">
              <strong>{entry.profileFullName}</strong>
              <span>
                {statusLabels[entry.previousStatus]} → {statusLabels[entry.newStatus]} ·{' '}
                {entry.adminEmail}
              </span>
              <small>{formatDateTime(entry.createdAt)}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
