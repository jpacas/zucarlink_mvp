// Elimina los perfiles demo (correos @zucarlink.test) creados por los scripts de seed
// de las Semanas 5-9, para dejar la base lista antes de importar usuarios reales.
//
// Uso:
//   node scripts/cleanup-demo-data.mjs              # dry-run (no borra nada)
//   node scripts/cleanup-demo-data.mjs --execute     # borrado real
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

const DEMO_EMAIL_SUFFIX = '@zucarlink.test'

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

async function listDemoUsers(client) {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (error) {
    throw new Error(`No se pudo listar usuarios: ${error.message}`)
  }

  return data.users.filter((user) => user.email?.toLowerCase().endsWith(DEMO_EMAIL_SUFFIX))
}

async function listOrphanCompanies(client) {
  const { data: profileCompanyIds, error: profilesError } = await client
    .from('profiles')
    .select('current_company_id')
    .not('current_company_id', 'is', null)

  if (profilesError) {
    throw new Error(`No se pudieron leer perfiles: ${profilesError.message}`)
  }

  const { data: experienceCompanyIds, error: experiencesError } = await client
    .from('experiences')
    .select('company_id')
    .not('company_id', 'is', null)

  if (experiencesError) {
    throw new Error(`No se pudieron leer experiencias: ${experiencesError.message}`)
  }

  const referencedIds = new Set([
    ...profileCompanyIds.map((row) => row.current_company_id),
    ...experienceCompanyIds.map((row) => row.company_id),
  ])

  const { data: companies, error: companiesError } = await client.from('companies').select('id, name')

  if (companiesError) {
    throw new Error(`No se pudieron leer empresas: ${companiesError.message}`)
  }

  return (companies ?? []).filter((company) => !referencedIds.has(company.id))
}

async function main() {
  loadLocalEnv()

  const execute = process.argv.includes('--execute')

  const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  writeLine(`Modo: ${execute ? 'EJECUCIÓN REAL' : 'DRY-RUN (no se borra nada)'}`)

  const demoUsers = await listDemoUsers(client)

  writeLine(`Usuarios demo encontrados (${DEMO_EMAIL_SUFFIX}): ${demoUsers.length}`)

  for (const user of demoUsers) {
    writeLine(`- ${user.email} (${user.id})`)

    if (!execute) {
      continue
    }

    const { error } = await client.auth.admin.deleteUser(user.id)

    if (error) {
      writeError(`  -> ERROR al borrar: ${error.message}`)
      continue
    }

    writeLine('  -> borrado (perfiles, experiencias y especialidades se eliminan en cascada).')
  }

  writeLine('')

  const orphanCompanies = await listOrphanCompanies(client)

  if (orphanCompanies.length > 0) {
    writeLine('Empresas sin ninguna referencia (perfil o experiencia) — revisar y borrar manualmente si son demo:')
    for (const company of orphanCompanies) {
      writeLine(`- ${company.name} (${company.id})`)
    }
  } else {
    writeLine('No hay empresas huérfanas.')
  }

  if (!execute) {
    writeLine('')
    writeLine('Corre con --execute para borrar los usuarios demo listados arriba.')
  }
}

main().catch((error) => {
  writeError(error.message)
  process.exitCode = 1
})
