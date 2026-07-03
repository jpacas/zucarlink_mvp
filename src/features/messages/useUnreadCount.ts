import { useEffect, useRef, useState } from 'react'

import { countMyUnread } from './api'

const POLL_MS = 90_000

export function useUnreadCount(enabled = true): number {
  const [count, setCount] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = () => {
    void countMyUnread()
      .then(setCount)
      .catch(() => {})
  }

  useEffect(() => {
    if (!enabled) return

    const startPolling = () => {
      if (pollRef.current) return
      refresh()
      pollRef.current = setInterval(refresh, POLL_MS)
    }

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling()
      } else {
        stopPolling()
      }
    }

    if (document.visibilityState === 'visible') {
      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopPolling()
    }
  }, [enabled])

  return count
}
