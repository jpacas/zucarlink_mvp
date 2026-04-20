export function isPublicConfigurationError(message: string | null | undefined) {
  const normalizedMessage = message?.toLowerCase() ?? ''

  return (
    normalizedMessage.includes('supabase no está configurado') ||
    normalizedMessage.includes('supabase no esta configurado') ||
    normalizedMessage.includes('faltan variables de entorno')
  )
}
