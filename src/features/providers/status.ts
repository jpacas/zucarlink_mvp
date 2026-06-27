import type { ProviderStatus } from './types'

export type ProviderStatusTone = 'info' | 'success' | 'muted'

export interface ProviderStatusMeta {
  /** Etiqueta corta y legible para un badge (sin jerga interna). */
  label: string
  /** Explicación de una línea de qué significa el estado para el proveedor. */
  description: string
  /** True si la ficha es visible en el directorio público. */
  isPublic: boolean
  tone: ProviderStatusTone
  /** Clase modificadora del badge para reflejar el tono. */
  badgeClass: string
}

const STATUS_META: Record<ProviderStatus, ProviderStatusMeta> = {
  draft_profile: {
    label: 'Borrador',
    description:
      'Tu ficha está guardada como borrador. Complétala y envíala para solicitar la activación.',
    isPublic: false,
    tone: 'muted',
    badgeClass: 'user-badge--muted',
  },
  lead: {
    label: 'En revisión',
    description:
      'Tu ficha quedó enviada y está pendiente de activación. Te avisaremos cuando sea visible en el directorio.',
    isPublic: false,
    tone: 'info',
    badgeClass: 'user-badge--info',
  },
  active: {
    label: 'Activa',
    description: 'Tu ficha es pública en el directorio de proveedores.',
    isPublic: true,
    tone: 'success',
    badgeClass: 'user-badge--success',
  },
  inactive: {
    label: 'Inactiva',
    description:
      'Tu ficha no está visible en el directorio. Escríbenos si quieres reactivarla.',
    isPublic: false,
    tone: 'muted',
    badgeClass: 'user-badge--muted',
  },
}

export function getProviderStatusMeta(status: ProviderStatus): ProviderStatusMeta {
  return STATUS_META[status]
}

export function providerStatusLabel(status: ProviderStatus): string {
  return STATUS_META[status].label
}
