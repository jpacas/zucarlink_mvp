import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { createSupabaseAuthFake, type SupabaseAuthFake } from './fakes/supabase'

interface RenderAppOptions {
  initialRoute?: string
  supabase?: SupabaseAuthFake | null
}

export async function renderApp({
  initialRoute = '/',
  supabase = createSupabaseAuthFake(),
}: RenderAppOptions = {}) {
  vi.resetModules()
  const supabaseModule = await import('../lib/supabase')
  vi.spyOn(supabaseModule, 'getSupabaseBrowserClient').mockImplementation(
    () => supabase as never,
  )

  const [{ App }, { AuthProvider }] = await Promise.all([
    import('../app/App'),
    import('../features/auth/AuthProvider'),
  ])

  const result = render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  )

  return result as RenderResult
}
