import { useEffect, useState } from 'react'

import { getMyNotificationPreferences, updateMyNotificationPreferences } from './api'
import type { NotificationPreferences } from './api'

const TOGGLES: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'emailUnreadReminder', label: 'Recordatorio de mensajes sin leer (a las 24 horas)' },
  { key: 'emailForumReply', label: 'Respuestas a temas que abriste en el foro' },
  { key: 'emailLikedTopicReply', label: 'Respuestas a temas del foro que te gustaron' },
  { key: 'emailInactivityDigest', label: 'Resumen de actividad si llevas una semana sin entrar' },
]

export function NotificationPreferencesCard({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyNotificationPreferences(userId)
      .then((data) => {
        if (!cancelled) setPrefs(data)
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar tus preferencias.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    if (!prefs) return

    const previous = prefs
    setPrefs({ ...prefs, [key]: value })
    setErrorMessage(null)

    try {
      await updateMyNotificationPreferences(userId, { [key]: value })
    } catch (error) {
      setPrefs(previous)
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el cambio.')
    }
  }

  return (
    <article className="info-card stack">
      <h3>Notificaciones</h3>
      <p className="helper-text">
        Elige qué correos quieres recibir de Zucarlink.
      </p>

      {isLoading ? (
        <p className="helper-text">Cargando preferencias…</p>
      ) : prefs ? (
        <div className="stack">
          {TOGGLES.map(({ key, label }) => (
            <label key={key} className="checkbox-row">
              <input
                type="checkbox"
                checked={prefs[key] as boolean}
                disabled={prefs.unsubscribedAll}
                onChange={(event) => handleToggle(key, event.target.checked)}
              />
              {label}
            </label>
          ))}

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={prefs.unsubscribedAll}
              onChange={(event) => handleToggle('unsubscribedAll', event.target.checked)}
            />
            Pausar todos los correos de notificación
          </label>
        </div>
      ) : null}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </article>
  )
}
