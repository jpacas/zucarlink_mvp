import { getSupabaseClientOrThrow } from '../../lib/supabase'

export async function requestPasswordReset(email: string) {
  const client = getSupabaseClientOrThrow()

  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/nueva-contrasena`,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updatePassword(newPassword: string) {
  const client = getSupabaseClientOrThrow()

  const { error } = await client.auth.updateUser({ password: newPassword })

  if (error) {
    throw new Error(error.message)
  }
}
