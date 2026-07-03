// Migra usuarios reales desde el respaldo MySQL legacy (Sequelize) hacia Supabase.
//
// Uso:
//   node scripts/migrate-legacy-users.mjs "<ruta-al-dump.sql>"              # dry-run (no escribe nada)
//   node scripts/migrate-legacy-users.mjs "<ruta-al-dump.sql>" --execute    # corrida real
//
// El dump contiene PII (correos, hashes bcrypt de contraseña) y NO debe copiarse al
// repo. Este script lo lee desde la ruta que le pases en el momento de ejecutarlo.
//
// Requiere en .env/.env.local: SUPABASE_URL (o VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Areas.id (legacy) -> slugs de public.specialties. Ajustar antes de correr si hace falta.
const AREA_TO_SPECIALTY_SLUGS = {
  1: ['campo'], // Campo
  2: ['molinos'], // Molinos
  3: ['cristalizacion', 'evaporacion'], // Fabrica de Azucar
  4: ['calderas'], // Calderas
  5: ['energia'], // Energia Electrica
  6: ['destileria-alcohol'], // Alcohol
  7: ['laboratorio'], // Laboratorios
  8: ['instrumentacion'], // Instrumentacion
  9: ['mantenimiento-mecanico'], // Mantenimiento
  10: ['calidad'], // Sistemas de Gestion
  11: [], // Administracion — sin especialidad técnica equivalente
  12: [], // Otros
}

// Ingenios.id (legacy) -> nombre final en public.companies. Ajustar antes de correr si hace falta.
const INGENIO_NAME_OVERRIDES = {
  1: 'Ingenio La Cabaña',
  2: 'Ingenio El Ángel',
  3: 'Ingenio Chaparrastique',
  4: 'Ingenio Jiboa',
  5: 'Central Izalco',
  6: 'Ingenio La Magdalena',
  7: 'Ingenio Choluteca',
  8: 'Ingenio Tres Valles',
  9: 'Ingenio Chumbagua',
  10: 'Ingenio La Grecia',
  11: 'Ingenio Santa Matilde',
  12: 'Azucarera del Norte',
  13: 'Ingenio Monte Rosa',
  14: 'Ingenio San Antonio',
  15: 'Ingenio Montelimar',
  16: 'Ingenio Casur',
  17: 'Ingenio Santa Ana',
  18: 'Ingenio Pantaleón',
  19: 'Ingenio Palo Gordo',
  20: 'Ingenio La Unión',
  21: 'Ingenio Madre Tierra',
  22: 'Ingenio Tululá',
  23: 'Ingenio San Diego - Trinidad',
  24: 'Ingenio Santa Teresa',
  25: 'Ingenio La Sonrisa',
  26: 'Ingenio Magdalena',
  27: 'Ingenio Atirro',
  28: 'CATSA',
  29: 'Ingenio Cutris',
  30: 'Ingenio El Palmar',
  31: 'Ingenio El Viejo',
  32: 'Ingenio Juan Viñas',
  33: 'Ingenio Porvenir',
  34: 'Ingenio Providencia',
  35: 'Coopevictoria',
  36: 'Ingenio Taboga',
  37: 'Ingenio Ofelina',
  38: 'Ingenio Santa Rosa',
  39: 'Central Azucarero La Victoria',
}

const AVATAR_BUCKET = 'avatars'
const GENERIC_AVATAR_MARKER = 'avatar-generico'

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

// --- Parser mínimo de dumps mysqldump: extrae las tuplas de un INSERT INTO ---

function extractInsertLine(sqlText, tableName) {
  const pattern = new RegExp(`^INSERT INTO \`${tableName}\` VALUES (.+);$`, 'mu')
  const match = sqlText.match(pattern)
  return match ? match[1] : null
}

// Parsea una lista de tuplas "(a,b,'c'),(d,e,NULL)" respetando comillas y escapes.
function parseValueTuples(valuesText) {
  const tuples = []
  let i = 0
  const n = valuesText.length

  function parseTuple() {
    const values = []
    i++ // consume '('

    while (true) {
      while (i < n && /\s/u.test(valuesText[i])) i++

      if (valuesText[i] === "'") {
        values.push(parseString())
      } else {
        values.push(parseBareToken())
      }

      while (i < n && /\s/u.test(valuesText[i])) i++

      if (valuesText[i] === ',') {
        i++
        continue
      }

      if (valuesText[i] === ')') {
        i++
        break
      }

      throw new Error(`Error de parseo en posición ${i}: se esperaba ',' o ')'`)
    }

    return values
  }

  function parseString() {
    i++ // consume opening quote
    let result = ''

    while (i < n) {
      const char = valuesText[i]

      if (char === '\\') {
        const next = valuesText[i + 1]
        const map = { n: '\n', r: '\r', t: '\t', '0': '\0', "'": "'", '"': '"', '\\': '\\' }
        result += next in map ? map[next] : next
        i += 2
        continue
      }

      if (char === "'") {
        if (valuesText[i + 1] === "'") {
          result += "'"
          i += 2
          continue
        }
        i++ // consume closing quote
        return result
      }

      result += char
      i++
    }

    throw new Error('Cadena sin cerrar en el dump')
  }

  function parseBareToken() {
    let token = ''
    while (i < n && !/[,)]/u.test(valuesText[i])) {
      token += valuesText[i]
      i++
    }
    token = token.trim()
    return token === 'NULL' ? null : token
  }

  while (i < n) {
    while (i < n && /\s/u.test(valuesText[i])) i++
    if (i >= n) break
    if (valuesText[i] === ',') {
      i++
      continue
    }
    if (valuesText[i] === '(') {
      tuples.push(parseTuple())
      continue
    }
    throw new Error(`Token inesperado en posición ${i}: "${valuesText[i]}"`)
  }

  return tuples
}

function loadTable(sqlText, tableName, columns) {
  const raw = extractInsertLine(sqlText, tableName)

  if (!raw) {
    return []
  }

  const tuples = parseValueTuples(raw)

  return tuples.map((values) => {
    const row = {}
    columns.forEach((col, idx) => {
      row[col] = values[idx]
    })
    return row
  })
}

function loadLegacyDump(dumpPath) {
  const sqlText = readFileSync(dumpPath, 'utf8')

  const pais = loadTable(sqlText, 'Pais', ['id', 'nombre'])
  const areas = loadTable(sqlText, 'Areas', ['id', 'nombre'])
  const ingenios = loadTable(sqlText, 'Ingenios', [
    'id',
    'nombre',
    'email',
    'webpage',
    'logo',
    'createdAt',
    'updatedAt',
    'paisId',
  ])
  const users = loadTable(sqlText, 'Users', [
    'id',
    'nombre',
    'apellido',
    'email',
    'password',
    'avatarUrl',
    'acercaDe',
    'fecha_nacimiento',
    'ingenioId',
    'proveedorId',
    'createdAt',
    'updatedAt',
    'paisId',
    'areaId',
  ])
  const experiencias = loadTable(sqlText, 'Experiencias', [
    'id',
    'fechaInicio',
    'fechaFin',
    'actualmenteTrabaja',
    'cargo',
    'acercaDe',
    'createdAt',
    'updatedAt',
    'usuarioId',
    'ingenioId',
    'areaId',
    'paisId',
  ])

  return { pais, areas, ingenios, users, experiencias }
}

// --- Transformación de datos legacy -> modelo Supabase ---

function buildFullName(user) {
  return `${user.nombre ?? ''} ${user.apellido ?? ''}`.replace(/\s+/gu, ' ').trim()
}

function findCurrentRole(experiencias, userId) {
  const owned = experiencias
    .filter((exp) => exp.usuarioId === userId && exp.actualmenteTrabaja === '1')
    .sort((a, b) => (a.fechaInicio < b.fechaInicio ? 1 : -1))

  return owned.length > 0 ? owned[0].cargo : null
}

function estimateYearsExperience(experiencias, userId) {
  const owned = experiencias.filter((exp) => exp.usuarioId === userId && exp.fechaInicio)

  if (owned.length === 0) {
    return null
  }

  const earliest = owned.reduce((min, exp) => (exp.fechaInicio < min ? exp.fechaInicio : min), owned[0].fechaInicio)
  const years = new Date().getFullYear() - new Date(earliest).getFullYear()

  return years >= 0 ? years : null
}

function isGenericAvatar(avatarUrl) {
  return !avatarUrl || avatarUrl.includes(GENERIC_AVATAR_MARKER)
}

function computeProfileStatus({ country }) {
  // Solo país es obligatorio para listar el perfil (nombre siempre viene del dump).
  // Cargo, empresa, bio y especialidades son deseables pero no bloquean la visibilidad:
  // exigirlos dejaba fuera a la mayoría de usuarios legacy, que rara vez completan
  // todos esos campos en el sistema anterior.
  return country?.trim() ? 'complete' : 'incomplete'
}

// --- Operaciones contra Supabase ---

async function findExistingUserByEmail(client, email) {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (error) {
    throw new Error(`No se pudo listar usuarios: ${error.message}`)
  }

  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureCompany(client, companyCache, name, country) {
  const cleanName = name.trim()
  const cacheKey = cleanName.toLowerCase()

  if (companyCache.has(cacheKey)) {
    return companyCache.get(cacheKey)
  }

  const { data: existing, error: existingError } = await client
    .from('companies')
    .select('id')
    .ilike('name', cleanName)
    .maybeSingle()

  if (existingError) {
    throw new Error(`No se pudo consultar empresa ${cleanName}: ${existingError.message}`)
  }

  if (existing) {
    companyCache.set(cacheKey, existing.id)
    return existing.id
  }

  const { data: created, error: createError } = await client
    .from('companies')
    .insert({ name: cleanName, country: country || null })
    .select('id')
    .single()

  if (createError) {
    throw new Error(`No se pudo crear empresa ${cleanName}: ${createError.message}`)
  }

  companyCache.set(cacheKey, created.id)
  return created.id
}

async function loadSpecialtyMap(client) {
  const { data, error } = await client.from('specialties').select('id, slug')

  if (error) {
    throw new Error(`No se pudieron cargar especialidades: ${error.message}`)
  }

  return new Map((data ?? []).map((specialty) => [specialty.slug, specialty.id]))
}

async function downloadAvatar(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

  return { buffer, contentType, extension }
}

async function migrateAvatar(client, userId, avatarUrl) {
  const { buffer, contentType, extension } = await downloadAvatar(avatarUrl)
  const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage.from(AVATAR_BUCKET).upload(storagePath, buffer, {
    cacheControl: '31536000',
    contentType,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  return storagePath
}

async function main() {
  loadLocalEnv()

  const args = process.argv.slice(2).filter((a) => a !== '--execute')
  const execute = process.argv.includes('--execute')
  const dumpPath = args[0]

  if (!dumpPath) {
    throw new Error('Uso: node scripts/migrate-legacy-users.mjs "<ruta-al-dump.sql>" [--execute]')
  }

  if (!existsSync(dumpPath)) {
    throw new Error(`No existe el archivo: ${dumpPath}`)
  }

  const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { pais, areas, users, experiencias } = loadLegacyDump(dumpPath)
  const paisById = new Map(pais.map((p) => [p.id, p.nombre]))
  const areasById = new Map(areas.map((a) => [a.id, a.nombre]))

  writeLine(`Modo: ${execute ? 'EJECUCIÓN REAL' : 'DRY-RUN (no se escribe nada)'}`)
  writeLine(`Usuarios encontrados en el dump: ${users.length}`)
  writeLine('')

  const specialtyMap = execute ? await loadSpecialtyMap(client) : null
  const companyCache = new Map()

  let created = 0
  let skippedExisting = 0
  let failed = 0
  let avatarsMigrated = 0
  let avatarsFailed = 0

  for (const user of users) {
    const fullName = buildFullName(user)
    const country = paisById.get(user.paisId) ?? null
    const areaName = areasById.get(user.areaId) ?? null
    const specialtySlugs = AREA_TO_SPECIALTY_SLUGS[user.areaId] ?? []
    const companyName = INGENIO_NAME_OVERRIDES[user.ingenioId] ?? null
    const roleTitle = findCurrentRole(experiencias, user.id)
    const yearsExperience = estimateYearsExperience(experiencias, user.id)
    const shortBio = user.acercaDe?.trim() || null
    const wantsAvatarMigration = !isGenericAvatar(user.avatarUrl)
    const profileStatus = computeProfileStatus({ country, roleTitle, companyName, shortBio, specialtySlugs })

    writeLine(`- ${fullName} <${user.email}>`)
    writeLine(`    país: ${country ?? '(ninguno)'} | empresa: ${companyName ?? '(ninguna)'} | área legacy: ${areaName ?? '(ninguna)'} → especialidades: ${specialtySlugs.join(', ') || '(ninguna)'}`)
    writeLine(`    cargo actual: ${roleTitle ?? '(sin experiencia activa)'} | años exp. estimados: ${yearsExperience ?? '(sin datos)'} | avatar: ${wantsAvatarMigration ? 'real, se migrará' : 'genérico, se omite'}`)
    writeLine(`    profile_status resultante: ${profileStatus}`)

    if (!execute) {
      const existing = await findExistingUserByEmail(client, user.email).catch(() => null)
      if (existing) {
        writeLine('    -> OMITIR: ya existe un usuario con este correo en Supabase.')
        skippedExisting++
      }
      writeLine('')
      continue
    }

    try {
      const existing = await findExistingUserByEmail(client, user.email)

      if (existing) {
        writeLine('    -> OMITIDO: ya existe un usuario con este correo en Supabase.')
        skippedExisting++
        writeLine('')
        continue
      }

      const { data: createdUser, error: createError } = await client.auth.admin.createUser({
        email: user.email,
        password_hash: user.password,
        email_confirm: true,
        user_metadata: { account_type: 'technician', full_name: fullName },
        app_metadata: { provider: 'email', providers: ['email'] },
      })

      if (createError) {
        throw new Error(`No se pudo crear el usuario: ${createError.message}`)
      }

      const userId = createdUser.user.id
      const companyId = companyName ? await ensureCompany(client, companyCache, companyName, country) : null

      const { error: profileError } = await client
        .from('profiles')
        .update({
          country,
          role_title: roleTitle,
          current_company_id: companyId,
          years_experience: yearsExperience,
          short_bio: shortBio,
          profile_status: profileStatus,
        })
        .eq('id', userId)

      if (profileError) {
        throw new Error(`No se pudo actualizar el perfil: ${profileError.message}`)
      }

      if (specialtySlugs.length > 0) {
        const specialtyIds = specialtySlugs
          .map((slug) => specialtyMap.get(slug))
          .filter((id) => Boolean(id))

        if (specialtyIds.length > 0) {
          const { error: specialtyError } = await client
            .from('profile_specialties')
            .insert(specialtyIds.map((specialtyId) => ({ profile_id: userId, specialty_id: specialtyId })))

          if (specialtyError) {
            throw new Error(`No se pudieron guardar especialidades: ${specialtyError.message}`)
          }
        }
      }

      const ownExperiences = experiencias.filter((exp) => exp.usuarioId === user.id)

      for (const exp of ownExperiences) {
        const expCompanyName = INGENIO_NAME_OVERRIDES[exp.ingenioId] ?? companyName
        const expCountry = paisById.get(exp.paisId) ?? country
        const expCompanyId = expCompanyName
          ? await ensureCompany(client, companyCache, expCompanyName, expCountry)
          : null

        const { error: expError } = await client.from('experiences').insert({
          profile_id: userId,
          company_id: expCompanyId,
          role_title: exp.cargo,
          start_date: exp.fechaInicio ? exp.fechaInicio.slice(0, 10) : null,
          end_date: exp.fechaFin ? exp.fechaFin.slice(0, 10) : null,
          is_current: exp.actualmenteTrabaja === '1',
          summary: exp.acercaDe,
          description: exp.acercaDe,
        })

        if (expError) {
          throw new Error(`No se pudo guardar experiencia: ${expError.message}`)
        }
      }

      if (wantsAvatarMigration) {
        try {
          const avatarPath = await migrateAvatar(client, userId, user.avatarUrl)

          const { error: avatarError } = await client
            .from('profiles')
            .update({ avatar_path: avatarPath })
            .eq('id', userId)

          if (avatarError) {
            throw new Error(avatarError.message)
          }

          avatarsMigrated++
        } catch (avatarErr) {
          avatarsFailed++
          writeError(`    aviso: no se pudo migrar el avatar de ${user.email}: ${avatarErr.message}`)
        }
      }

      writeLine('    -> creado.')
      created++
    } catch (err) {
      failed++
      writeError(`    -> ERROR: ${err.message}`)
    }

    writeLine('')
  }

  writeLine('--- Resumen ---')
  if (execute) {
    writeLine(`Creados: ${created}`)
    writeLine(`Omitidos (ya existían): ${skippedExisting}`)
    writeLine(`Errores: ${failed}`)
    writeLine(`Avatares migrados: ${avatarsMigrated}`)
    writeLine(`Avatares fallidos: ${avatarsFailed}`)
  } else {
    writeLine(`Usuarios que colisionan con un correo existente: ${skippedExisting}`)
    writeLine('Corre con --execute para aplicar los cambios.')
  }
}

main().catch((error) => {
  writeError(error.message)
  process.exitCode = 1
})
