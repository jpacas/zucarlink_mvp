type TagVariant = 'tecnico' | 'proveedor' | 'info'

interface TagBadgeProps {
  label: string
  variant?: TagVariant
}

export function TagBadge({ label, variant }: TagBadgeProps) {
  return <span className={`tag-badge${variant ? ` tag-badge--${variant}` : ''}`}>{label}</span>
}
