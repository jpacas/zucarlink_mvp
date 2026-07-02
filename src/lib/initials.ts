export function getInitials(name: string | null | undefined, fallback = 'Z') {
  return name?.slice(0, 1).toUpperCase() || fallback
}
