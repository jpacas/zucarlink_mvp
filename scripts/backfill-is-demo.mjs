// T10b: marca is_demo=true en las cuentas demo YA existentes en producción
// (creadas antes de que la columna existiera). Deliberadamente NO reusa ni
// re-invoca seed-week5-demo-profiles.mjs: ese script resetea la contraseña de
// cada cuenta (ensureUser) y borra+reinserta experiences/profile_specialties
// (syncExperiences/syncSpecialties) en cada corrida — correrlo contra
// producción destruye datos reales de esas cuentas si alguien los editó desde
// que se sembraron. Este script solo hace UPDATE profiles.is_demo por email
// conocido, sin tocar nada más.
//
// Uso: node scripts/backfill-is-demo.mjs
// Requiere las mismas env vars que el seed script (SUPABASE_URL o
// VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Debe coincidir con los emails de `demoProfiles` en seed-week5-demo-profiles.mjs.
const DEMO_EMAILS = [
  'demo.ana.mejia@zucarlink.test',
  'demo.carlos.ruiz@zucarlink.test',
  'demo.maria.fernandez@zucarlink.test',
  'demo.jose.guzman@zucarlink.test',
  'demo.lucia.paredes@zucarlink.test',
  'demo.ricardo.soto@zucarlink.test',
  'demo.paola.vargas@zucarlink.test',
  'demo.diego.carrillo@zucarlink.test',
  'demo.valentina.paz@zucarlink.test',
  'demo.esteban.ortiz@zucarlink.test',
]

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

async function main() {
  loadLocalEnv()

  const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: userList, error: listError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    throw new Error(`No se pudo listar usuarios: ${listError.message}`)
  }

  const emailSet = new Set(DEMO_EMAILS.map((email) => email.toLowerCase()))
  const matchedIds = userList.users
    .filter((user) => user.email && emailSet.has(user.email.toLowerCase()))
    .map((user) => user.id)

  if (matchedIds.length === 0) {
    writeLine('No se encontraron cuentas demo por email. Nada que backfillear.')
    return
  }

  const { data: updated, error: updateError } = await client
    .from('profiles')
    .update({ is_demo: true })
    .in('id', matchedIds)
    .select('id')

  if (updateError) {
    throw new Error(`No se pudo actualizar is_demo: ${updateError.message}`)
  }

  writeLine(`Cuentas demo encontradas por email: ${matchedIds.length}`)
  writeLine(`Perfiles marcados is_demo=true: ${(updated ?? []).length}`)

  if ((updated ?? []).length !== matchedIds.length) {
    writeLine(
      'Aviso: algunos user IDs encontrados en auth.users no tienen fila en profiles (cuenta sin perfil creado). Revisar manualmente si es inesperado.',
    )
  }
}

main().catch((error) => {
  writeError(error.message)
  process.exitCode = 1
})
