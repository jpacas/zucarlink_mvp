import { useEffect, useRef, useState } from 'react'

import { listMyThreads } from './api'

const POLL_MS = 30_000

export function useUnreadCount(enabled = true): number {
  const [count, setCount] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = () => {
    void listMyThreads()
      .then((threads) => setCount(threads.reduce((sum, t) => sum + t.unreadCount, 0)))
      .catch(() => {})
  }

  useEffect(() => {
    if (!enabled) return
    refresh()
    pollRef.current = setInterval(refresh, POLL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [enabled])

  return count
}
