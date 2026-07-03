// Recalcula profiles.profile_status para perfiles ya existentes usando el criterio
// vigente (país presente => 'complete'), tras relajar computeProfileStatus() en
// migrate-legacy-users.mjs. Necesario porque los perfiles migrados antes de ese
// cambio quedaron marcados 'incomplete' con el criterio anterior, más estricto,
// y por eso no aparecían en las vistas públicas ni privadas del directorio.
//
// Uso:
//   node scripts/backfill-profile-status.mjs              # dry-run (no escribe nada)
//   node scripts/backfill-profile-status.mjs --execute    # corrida real
//
// Requiere en .env/.env.local: SUPABASE_URL (o VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.

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

function requiredEnv(name, fallback) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : '')

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}${fallback ? ` (o ${fallback})` : ''}.`)
  }

  return value
}

function writeLine(message) {
  process.stdout.write(`${message}\n`)
}

async function main() {
  loadLocalEnv()

  const execute = process.argv.includes('--execute')
  const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  writeLine(`Modo: ${execute ? 'EJECUCIÓN REAL' : 'DRY-RUN (no se escribe nada)'}`)

  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, country, profile_status')
    .eq('profile_status', 'incomplete')

  if (error) {
    throw new Error(`No se pudo leer profiles: ${error.message}`)
  }

  const toPromote = data.filter((p) => Boolean(p.country?.trim()))

  writeLine(`Perfiles 'incomplete' encontrados: ${data.length}`)
  writeLine(`De esos, tienen país y pasarán a 'complete': ${toPromote.length}`)
  writeLine('')

  for (const profile of toPromote) {
    writeLine(`- ${profile.full_name ?? profile.id} (${profile.country})`)
  }

  if (!execute) {
    writeLine('')
    writeLine('Corre con --execute para aplicar el cambio.')
    return
  }

  for (const profile of toPromote) {
    const { error: updateError } = await client
      .from('profiles')
      .update({ profile_status: 'complete' })
      .eq('id', profile.id)

    if (updateError) {
      writeLine(`ERROR actualizando ${profile.id}: ${updateError.message}`)
      continue
    }
  }

  writeLine('')
  writeLine(`Listo: ${toPromote.length} perfiles actualizados a 'complete'.`)
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`)
  process.exitCode = 1
})
