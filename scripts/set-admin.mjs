import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/u, '$1')
      .replace(/^'(.*)'$/u, '$1')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function loadLocalEnv() {
  loadEnvFile(path.join(projectRoot, '.env'))
  loadEnvFile(path.join(projectRoot, '.env.local'))
}

function writeLine(message) {
  process.stdout.write(`${message}\n`)
}

function writeError(message) {
  process.stderr.write(`${message}\n`)
}

function requiredEnv(name, fallback) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : '')

  if (!value) {
    throw new Error(`Falta la variable ${name}${fallback ? ` (o ${fallback})` : ''}.`)
  }

  return value
}

function printUsage() {
  writeError('Uso: node scripts/set-admin.mjs <email> [--revoke]')
  writeError('')
  writeError('  <email>    Correo del usuario al que se le otorgará (o revocará) el rol admin.')
  writeError('  --revoke   Si está presente, revoca el rol admin en lugar de otorgarlo.')
}

function parseArgs(argv) {
  const positional = argv.filter((arg) => !arg.startsWith('--'))
  const email = positional[0]
  const revoke = argv.includes('--revoke')

  if (!email) {
    return null
  }

  return { email, revoke }
}

async function findUserByEmail(client, email) {
  const normalizedEmail = email.toLowerCase()
  const perPage = 1000
  let page = 1

  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(`No se pudo listar usuarios: ${error.message}`)
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

    if (found) {
      return found
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function main() {
  loadLocalEnv()

  const args = parseArgs(process.argv.slice(2))

  if (!args) {
    printUsage()
    process.exitCode = 1
    return
  }

  const { email, revoke } = args

  const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const user = await findUserByEmail(client, email)

  if (!user) {
    throw new Error(`No se encontró ningún usuario con el correo ${email}.`)
  }

  // El endpoint admin de Supabase no documenta con certeza si `app_metadata`
  // se fusiona (merge) o se reemplaza por completo al llamar a updateUserById.
  // Para evitar borrar accidentalmente otras claves (p. ej. `provider`,
  // `providers`), leemos el app_metadata actual del usuario y lo combinamos
  // explícitamente antes de escribir.
  const currentAppMetadata = user.app_metadata ?? {}
  const nextAppMetadata = {
    ...currentAppMetadata,
    is_admin: !revoke,
  }

  const { error: updateError } = await client.auth.admin.updateUserById(user.id, {
    app_metadata: nextAppMetadata,
  })

  if (updateError) {
    throw new Error(`No se pudo actualizar el usuario ${email}: ${updateError.message}`)
  }

  const accion = revoke ? 'revocado' : 'otorgado'

  writeLine(`Rol admin ${accion} correctamente para ${email}.`)
  writeLine(
    'El usuario debe cerrar sesión y volver a iniciar sesión para que el cambio tome efecto (el JWT actual no lo refleja).',
  )
}

main().catch((error) => {
  writeError(error.message)
  process.exitCode = 1
})
