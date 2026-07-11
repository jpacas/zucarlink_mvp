const KNOWN_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Debes confirmar tu correo antes de iniciar sesión.'],
  [/user already registered/i, 'Ya existe una cuenta con ese correo.'],
  [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
  [/unable to validate email address/i, 'El correo ingresado no es válido.'],
  [/rate limit/i, 'Demasiados intentos. Espera un momento antes de volver a intentar.'],
  [/network/i, 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.'],
]

export function mapSupabaseAuthError(message: string | null | undefined): string | null {
  if (!message) return message ?? null

  const match = KNOWN_MESSAGES.find(([pattern]) => pattern.test(message))
  return match ? match[1] : message
}
