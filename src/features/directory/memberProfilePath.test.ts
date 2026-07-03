import { describe, expect, it } from 'vitest'

import { getMemberProfilePath } from './memberProfilePath'

describe('getMemberProfilePath', () => {
  it('returns the private directory route when authenticated', () => {
    expect(getMemberProfilePath('profile-1', true)).toBe('/app/directory/profile-1')
  })

  it('returns the public directory route when not authenticated', () => {
    expect(getMemberProfilePath('profile-1', false)).toBe('/directory/profile-1')
  })
})
