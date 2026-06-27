import { describe, expect, it } from 'vitest'

import { getProviderStatusMeta, providerStatusLabel } from './status'
import type { ProviderStatus } from './types'

const ALL_STATUSES: ProviderStatus[] = ['draft_profile', 'lead', 'active', 'inactive']

describe('provider status meta', () => {
  it('expone una etiqueta legible para cada estado, sin jerga interna', () => {
    for (const status of ALL_STATUSES) {
      const meta = getProviderStatusMeta(status)
      expect(meta.label.length).toBeGreaterThan(0)
      // Nunca mostrar el identificador crudo (p. ej. "lead" o "draft_profile").
      expect(meta.label.toLowerCase()).not.toBe(status)
      expect(meta.label).not.toContain('_')
      expect(meta.description.length).toBeGreaterThan(0)
    }
  })

  it('solo marca como pública la ficha activa', () => {
    expect(getProviderStatusMeta('active').isPublic).toBe(true)
    expect(getProviderStatusMeta('lead').isPublic).toBe(false)
    expect(getProviderStatusMeta('draft_profile').isPublic).toBe(false)
    expect(getProviderStatusMeta('inactive').isPublic).toBe(false)
  })

  it('providerStatusLabel devuelve la etiqueta corta del estado', () => {
    expect(providerStatusLabel('lead')).toBe('En revisión')
    expect(providerStatusLabel('active')).toBe('Activa')
  })
})
