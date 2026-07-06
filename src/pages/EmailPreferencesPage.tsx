import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AuthFormShell } from '../features/auth/AuthFormShell'
import { getEmailPrefsByToken, updateEmailPrefsByToken } from '../features/notifications/api'
import type { NotificationPreferences } from '../features/notifications/api'
import { usePageMetadata } from '../lib/usePageMetadata'

const TOGGLES: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'emailUnreadReminder', label: 'Recordatorio de mensajes sin leer (a las 24 horas)' },
  { key: 'emailForumReply', label: 'Respuestas a temas que abriste en el foro' },
  { key: 'emailLikedTopicReply', label: 'Respuestas a temas del foro que te gustaron' },
  { key: 'emailInactivityDigest', label: 'Resumen de actividad si llevas una semana sin entrar' },
]

export function EmailPreferencesPage() {
  usePageMetadata({
    title: 'Preferencias de correo',
    description: 'Elige qué correos de Zucarlink quieres recibir.',
    noindex: true,
  })

  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setErrorMessage('El enlace no es válido.')
      setIsLoading(false)
      return
    }

    getEmailPrefsByToken(token)
      .then((data) => {
        if (!data) {
          setErrorMessage('El enlace no es válido o ya expiró.')
          return
        }
        setPrefs(data)
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar tus preferencias.')
      })
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    if (!prefs || !token) return

    const previous = prefs
    setPrefs({ ...prefs, [key]: value })
    setErrorMessage(null)

    try {
      const found = await updateEmailPrefsByToken(token, { [key]: value })
      if (!found) {
        setPrefs(previous)
        setErrorMessage('El enlace no es válido o ya expiró.')
      }
    } catch (error) {
      setPrefs(previous)
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el cambio.')
    }
  }

  return (
    <AuthFormShell
      eyebrow="Zucarlink"
      title="Preferencias de correo"
      description="Elige qué correos de notificación quieres recibir. Los cambios se guardan al instante."
    >
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
            Darme de baja de todos los correos de notificación
          </label>
        </div>
      ) : null}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </AuthFormShell>
  )
}
