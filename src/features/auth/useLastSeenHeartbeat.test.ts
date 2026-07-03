import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import * as supabaseModule from '../../lib/supabase'
import { useLastSeenHeartbeat } from './useLastSeenHeartbeat'

describe('useLastSeenHeartbeat', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('touches last_seen on mount and throttles rapid revisits', () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.spyOn(supabaseModule, 'getSupabaseBrowserClient').mockReturnValue({ rpc } as never)
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000)

    renderHook(({ userId }) => useLastSeenHeartbeat(userId), {
      initialProps: { userId: 'user-1' },
    })

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('touch_last_seen')

    // Re-focusing moments later should not trigger another call (inside the throttle window).
    now.mockReturnValue(1_000_000 + 60_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(rpc).toHaveBeenCalledTimes(1)

    // Once the throttle window has elapsed, the next revisit touches again.
    now.mockReturnValue(1_000_000 + 5 * 60_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('does nothing without a signed-in user', () => {
    const rpc = vi.fn()
    vi.spyOn(supabaseModule, 'getSupabaseBrowserClient').mockReturnValue({ rpc } as never)

    renderHook(() => useLastSeenHeartbeat(undefined))

    expect(rpc).not.toHaveBeenCalled()
  })
})
