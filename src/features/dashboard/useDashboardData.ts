import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { listPublicPreviewProfiles, type PublicPreviewProfile } from '../directory/api'
import { listForumThreads } from '../forum/api'
import type { ForumThreadCard } from '../forum/types'
import { listMyThreads } from '../messages/api'
import type { MessageThread } from '../messages/types'
import { getProfileForumActivity } from '../profile/public-api'
import type { PublicProfileForumActivity } from '../profile/types'

export interface DashboardData {
  threads: MessageThread[]
  forumThreads: ForumThreadCard[]
  forumActivity: PublicProfileForumActivity | null
  members: PublicPreviewProfile[]
}

const EMPTY: DashboardData = {
  threads: [],
  forumThreads: [],
  forumActivity: null,
  members: [],
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback
}

/**
 * Carga las distintas fuentes de actividad del Panel en paralelo. Cada feed
 * degrada de forma independiente (Promise.allSettled): si una falla, su widget
 * muestra su estado vacío sin tumbar al resto del dashboard.
 */
export function useDashboardData(user: User | null, isProvider: boolean) {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [isLoading, setIsLoading] = useState(Boolean(user))

  useEffect(() => {
    if (!user) {
      setData(EMPTY)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const run = async () => {
      if (isProvider) {
        const [threads] = await Promise.allSettled([listMyThreads()])
        if (cancelled) return
        setData({ ...EMPTY, threads: settled(threads, []) })
      } else {
        const [threads, forumThreads, forumActivity, members] = await Promise.allSettled([
          listMyThreads(),
          listForumThreads(undefined, 3),
          getProfileForumActivity(user.id),
          listPublicPreviewProfiles(4),
        ])
        if (cancelled) return
        setData({
          threads: settled(threads, []),
          forumThreads: settled(forumThreads, []),
          forumActivity: settled(forumActivity, null),
          members: settled(members, []),
        })
      }

      if (!cancelled) setIsLoading(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [user, isProvider])

  return { data, isLoading }
}
