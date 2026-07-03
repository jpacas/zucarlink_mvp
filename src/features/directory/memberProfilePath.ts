// Único punto de decisión sobre a qué ruta debe apuntar un link al perfil de
// un miembro: la vista privada completa si hay sesión, la pública si no.
export function getMemberProfilePath(memberId: string, isAuthenticated: boolean): string {
  return isAuthenticated ? `/app/directory/${memberId}` : `/directory/${memberId}`
}
