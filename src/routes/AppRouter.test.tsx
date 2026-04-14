import { expect, it } from 'vitest'

import { createSupabaseAuthFake } from '../test/fakes/supabase'
import { renderApp } from '../test/render-app'

it('boots the auth router harness', async () => {
  const supabase = createSupabaseAuthFake()

  await renderApp({
    initialRoute: '/app',
    supabase,
  })

  expect(supabase.calls.getSession).toHaveLength(1)
})
