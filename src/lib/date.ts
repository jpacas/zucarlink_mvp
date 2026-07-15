// Formateadores de fecha unificados (locale es-SV) para los patrones que son
// genuinamente el mismo formato en toda la app. Formatos legítimamente
// distintos (ejes de gráfico, widgets de calendario, etc.) se quedan locales.

const dateFormatter = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const shortDateFormatter = new Intl.DateTimeFormat('es-SV', {
  day: 'numeric',
  month: 'short',
})

const monthYearFormatter = new Intl.DateTimeFormat('es-SV', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(value: string) {
  if (!value) {
    return ''
  }
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string) {
  if (!value) {
    return ''
  }
  return dateTimeFormatter.format(new Date(value))
}

export function formatMonthYear(value: string) {
  if (!value) {
    return ''
  }
  return monthYearFormatter.format(new Date(value))
}

// Rango legible para una entrada de experiencia profesional. Evita mostrar
// fechas ISO crudas (p.ej. "2011-05-02 · Actual") en las fichas de perfil.
export function formatExperienceRange(
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
) {
  const start = formatMonthYear(startDate)
  const end = isCurrent ? 'Actual' : endDate ? formatMonthYear(endDate) : 'Sin cierre'
  return start ? `${start} – ${end}` : end
}

export function formatRelative(value: string) {
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

  return shortDateFormatter.format(date)
}
