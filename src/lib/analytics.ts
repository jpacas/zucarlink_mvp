import { getSupabaseBrowserClient } from './supabase'
import type { Json } from './database.types'

// Fire-and-forget: nunca debe bloquear la UI ni lanzar. Un insert anónimo
// (usuario sin sesión) es rechazado en silencio por RLS — captura de
// visitantes no autenticados queda diferida a T1b (RPC security definer con
// rate limiting), ver plan de crecimiento técnico.
export function trackEvent(name: string, payload?: Record<string, unknown>) {
  const client = getSupabaseBrowserClient()

  if (!client) {
    return
  }

  void client
    .from('analytics_events')
    .insert({ event_name: name, payload: (payload ?? {}) as Json })
    .then(
      ({ error }) => {
        if (error) {
          console.error('analytics: no fue posible registrar el evento', name, error)
        }
      },
      (error: unknown) => {
        console.error('analytics: no fue posible registrar el evento', name, error)
      },
    )
}
