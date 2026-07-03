import { useEffect, useRef } from 'react'

import { getSupabaseBrowserClient } from '../../lib/supabase'

const HEARTBEAT_MS = 5 * 60 * 1000
const MIN_INTERVAL_MS = 4 * 60 * 1000

export function useLastSeenHeartbeat(userId: string | undefined): void {
  const lastSentRef = useRef(0)

  useEffect(() => {
    if (!userId) return

    const client = getSupabaseBrowserClient()
    if (!client) return

    const touch = () => {
      const now = Date.now()
      if (now - lastSentRef.current < MIN_INTERVAL_MS) return

      lastSentRef.current = now
      void client.rpc('touch_last_seen').then(({ error }) => {
        if (error) lastSentRef.current = 0
      })
    }

    touch()
    const intervalId = setInterval(touch, HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') touch()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId])
}
