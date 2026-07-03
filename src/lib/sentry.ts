import * as Sentry from '@sentry/react'

// No-op hasta que se defina VITE_SENTRY_DSN (crear proyecto gratis en sentry.io).
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })
}

export function captureException(error: unknown) {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return
  }

  Sentry.captureException(error)
}
