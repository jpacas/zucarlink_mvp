// Helpers de formato de fecha compartidos por las vistas del foro
// (listado y detalle del hilo).

export function formatForumDate(value: string) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeDate(value: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)

  const relative = new Intl.RelativeTimeFormat('es-SV', { numeric: 'auto' })

  if (absMinutes < 1) {
    return 'hace un momento'
  }
  if (absMinutes < 60) {
    return relative.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return relative.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) <= 7) {
    return relative.format(diffDays, 'day')
  }

  return new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}
