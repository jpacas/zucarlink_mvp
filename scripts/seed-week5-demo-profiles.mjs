import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const DEFAULT_PASSWORD = 'ZucarlinkDemo2026!'

const demoProfiles = [
  {
    email: 'demo.ana.mejia@zucarlink.test',
    fullName: 'Ana Lucía Mejía',
    country: 'Guatemala',
    roleTitle: 'Supervisora de campo',
    companyName: 'Ingenio Santa Lucía',
    yearsExperience: 9,
    shortBio:
      'Especialista en manejo agronómico de caña con foco en productividad por lote y coordinación de cuadrillas.',
    phone: '+502 5550 0101',
    whatsapp: '+502 5550 0101',
    linkedinUrl: 'https://www.linkedin.com/in/ana-lucia-mejia-zucarlink',
    verificationStatus: 'verified',
    specialties: ['campo', 'cosecha', 'riego'],
    experiences: [
      {
        companyName: 'Ingenio Santa Lucía',
        roleTitle: 'Supervisora de campo',
        startDate: '2021-02-01',
        endDate: null,
        isCurrent: true,
        description:
          'Coordina labores de preparación de suelo, riego y seguimiento de maduración en 4 zonas productivas.',
        achievements:
          'Redujo tiempos de respuesta de riego y estandarizó reportes semanales para jefatura agrícola.',
      },
      {
        companyName: 'Ingenio Palo Gordo',
        roleTitle: 'Ingeniera agrónoma de cosecha',
        startDate: '2017-01-15',
        endDate: '2021-01-31',
        isCurrent: false,
        description:
          'Planificó ventanas de corte y monitoreó calidad de materia prima recibida desde frente de cosecha.',
        achievements:
          'Mejoró la coordinación entre campo y patio de caña durante dos zafras consecutivas.',
      },
    ],
  },
  {
    email: 'demo.carlos.ruiz@zucarlink.test',
    fullName: 'Carlos Enrique Ruiz',
    country: 'El Salvador',
    roleTitle: 'Jefe de molinos',
    companyName: 'Ingenio La Cabaña',
    yearsExperience: 14,
    shortBio:
      'Operador senior de extracción con experiencia en eficiencia de molinos, preparación de caña y balance de pérdidas.',
    phone: '+503 7000 0202',
    whatsapp: '+503 7000 0202',
    linkedinUrl: 'https://www.linkedin.com/in/carlos-enrique-ruiz-zucarlink',
    verificationStatus: 'verified',
    specialties: ['molinos', 'preparacion-de-cana', 'energia'],
    experiences: [
      {
        companyName: 'Ingenio La Cabaña',
        roleTitle: 'Jefe de molinos',
        startDate: '2020-06-01',
        endDate: null,
        isCurrent: true,
        description:
          'Supervisa operación continua de tándem, imbibición y control de indicadores de extracción.',
        achievements:
          'Consolidó rutinas de turno para reducir variabilidad operativa y mejorar disciplina de datos.',
      },
      {
        companyName: 'Ingenio Chaparrastique',
        roleTitle: 'Supervisor de extracción',
        startDate: '2013-02-01',
        endDate: '2020-05-31',
        isCurrent: false,
        description:
          'Gestionó equipos de operación y coordinación con mantenimiento en arranques y paros programados.',
        achievements:
          'Disminuyó incidencias repetitivas mediante análisis de fallas por turno.',
      },
    ],
  },
  {
    email: 'demo.maria.fernandez@zucarlink.test',
    fullName: 'María José Fernández',
    country: 'Honduras',
    roleTitle: 'Ingeniera de calderas',
    companyName: 'Ingenio Azucarero Central',
    yearsExperience: 11,
    shortBio:
      'Profesional enfocada en vapor, combustión eficiente y estabilidad energética para operación de fábrica.',
    phone: '+504 3333 0303',
    whatsapp: '',
    linkedinUrl: 'https://www.linkedin.com/in/maria-jose-fernandez-zucarlink',
    verificationStatus: 'pending',
    specialties: ['calderas', 'energia', 'gestion-de-agua'],
    experiences: [
      {
        companyName: 'Ingenio Azucarero Central',
        roleTitle: 'Ingeniera de calderas',
        startDate: '2019-07-01',
        endDate: null,
        isCurrent: true,
        description:
          'Controla parámetros de combustión, purgas y coordinación con generación para sostener demanda energética.',
        achievements:
          'Estandarizó reportes diarios de eficiencia térmica y seguimiento de desviaciones.',
      },
      {
        companyName: 'Azucarera Choluteca',
        roleTitle: 'Analista de energía',
        startDate: '2015-03-01',
        endDate: '2019-06-30',
        isCurrent: false,
        description:
          'Monitoreó consumos específicos de vapor y agua en fábrica y casa de fuerza.',
        achievements:
          'Impulsó tableros operativos de pérdidas térmicas por área.',
      },
    ],
  },
  {
    email: 'demo.jose.guzman@zucarlink.test',
    fullName: 'José Manuel Guzmán',
    country: 'Nicaragua',
    roleTitle: 'Especialista en automatización',
    companyName: 'Ingenio San Antonio',
    yearsExperience: 8,
    shortBio:
      'Ingeniero de control con experiencia en instrumentación crítica, PLC y mejora de estabilidad de proceso.',
    phone: '',
    whatsapp: '+505 8888 0404',
    linkedinUrl: 'https://www.linkedin.com/in/jose-manuel-guzman-zucarlink',
    verificationStatus: 'verified',
    specialties: ['automatizacion', 'instrumentacion', 'proyectos'],
    experiences: [
      {
        companyName: 'Ingenio San Antonio',
        roleTitle: 'Especialista en automatización',
        startDate: '2022-01-10',
        endDate: null,
        isCurrent: true,
        description:
          'Administra lazos críticos de proceso, lógica de PLC y pruebas funcionales previas a zafra.',
        achievements:
          'Reducjo tiempos de diagnóstico en instrumentos críticos mediante matrices de fallas.',
      },
      {
        companyName: 'Ingenio Monte Rosa',
        roleTitle: 'Ingeniero de instrumentación',
        startDate: '2018-01-01',
        endDate: '2021-12-31',
        isCurrent: false,
        description:
          'Soportó calibración, mantenimiento y documentación técnica de instrumentación industrial.',
        achievements:
          'Ordenó histórico de calibraciones y criticidad por equipo.',
      },
    ],
  },
  {
    email: 'demo.lucia.paredes@zucarlink.test',
    fullName: 'Lucía Fernanda Paredes',
    country: 'Costa Rica',
    roleTitle: 'Coordinadora de calidad',
    companyName: 'Ingenio Taboga',
    yearsExperience: 10,
    shortBio:
      'Profesional de calidad y laboratorio con experiencia en control de proceso, inocuidad y trazabilidad.',
    phone: '+506 6000 0505',
    whatsapp: '',
    linkedinUrl: 'https://www.linkedin.com/in/lucia-fernanda-paredes-zucarlink',
    verificationStatus: 'verified',
    specialties: ['calidad', 'laboratorio', 'cristalizacion'],
    experiences: [
      {
        companyName: 'Ingenio Taboga',
        roleTitle: 'Coordinadora de calidad',
        startDate: '2020-09-01',
        endDate: null,
        isCurrent: true,
        description:
          'Coordina control de laboratorio, liberación de producto y seguimiento de variación en masas cocidas.',
        achievements:
          'Implementó tablero semanal de no conformidades y seguimiento de acciones correctivas.',
      },
      {
        companyName: 'Ingenio El Viejo',
        roleTitle: 'Analista de laboratorio',
        startDate: '2016-02-01',
        endDate: '2020-08-31',
        isCurrent: false,
        description:
          'Realizó análisis de jugos, mieles y azúcar final para soporte a la operación de fábrica.',
        achievements:
          'Mejoró consistencia del registro de resultados por turno.',
      },
    ],
  },
  {
    email: 'demo.ricardo.soto@zucarlink.test',
    fullName: 'Ricardo Andrés Soto',
    country: 'Panamá',
    roleTitle: 'Líder de mantenimiento mecánico',
    companyName: 'Central Azucarera La Victoria',
    yearsExperience: 16,
    shortBio:
      'Líder técnico en mantenimiento mecánico de fábrica, con foco en confiabilidad, paros programados y equipos rotativos.',
    phone: '',
    whatsapp: '+507 6222 0606',
    linkedinUrl: '',
    verificationStatus: 'pending',
    specialties: ['mantenimiento-mecanico', 'molinos', 'proyectos'],
    experiences: [
      {
        companyName: 'Central Azucarera La Victoria',
        roleTitle: 'Líder de mantenimiento mecánico',
        startDate: '2018-04-01',
        endDate: null,
        isCurrent: true,
        description:
          'Coordina mantenimiento mayor de molinos, bombas y transportadores durante paradas de zafra.',
        achievements:
          'Reordenó backlog mecánico por criticidad y ventana operativa.',
      },
      {
        companyName: 'Ingenio Alanje',
        roleTitle: 'Supervisor mecánico',
        startDate: '2010-01-15',
        endDate: '2018-03-31',
        isCurrent: false,
        description:
          'Gestionó cuadrillas de taller y correctivos de equipos de proceso.',
        achievements:
          'Disminuyó reincidencia de fallas en reductores mediante estándar de inspección.',
      },
    ],
  },
  {
    email: 'demo.paola.vargas@zucarlink.test',
    fullName: 'Paola Andrea Vargas',
    country: 'Colombia',
    roleTitle: 'Ingeniera de evaporación',
    companyName: 'Ingenio Providencia',
    yearsExperience: 7,
    shortBio:
      'Ingeniera de proceso orientada a evaporación y cristalización, con énfasis en estabilidad térmica y rendimiento.',
    phone: '+57 310 000 0707',
    whatsapp: '+57 310 000 0707',
    linkedinUrl: 'https://www.linkedin.com/in/paola-andrea-vargas-zucarlink',
    verificationStatus: 'verified',
    specialties: ['evaporacion', 'cristalizacion', 'centrifugacion'],
    experiences: [
      {
        companyName: 'Ingenio Providencia',
        roleTitle: 'Ingeniera de evaporación',
        startDate: '2021-05-01',
        endDate: null,
        isCurrent: true,
        description:
          'Da seguimiento a brix, vacío y economía de vapor en batería de evaporadores.',
        achievements:
          'Afinó rutinas de seguimiento de incrustación y desempeño por cuerpo.',
      },
      {
        companyName: 'Ingenio Riopaila Castilla',
        roleTitle: 'Analista de proceso',
        startDate: '2018-01-10',
        endDate: '2021-04-30',
        isCurrent: false,
        description:
          'Apoyó análisis de variables de proceso en casa de evaporación y tachos.',
        achievements:
          'Desarrolló reportes operativos para revisión diaria con jefatura.',
      },
    ],
  },
  {
    email: 'demo.diego.carrillo@zucarlink.test',
    fullName: 'Diego Alejandro Carrillo',
    country: 'México',
    roleTitle: 'Jefe de mantenimiento eléctrico',
    companyName: 'Ingenio El Potrero',
    yearsExperience: 13,
    shortBio:
      'Especialista en mantenimiento eléctrico industrial, protecciones, motores y disponibilidad de planta.',
    phone: '+52 271 000 0808',
    whatsapp: '',
    linkedinUrl: 'https://www.linkedin.com/in/diego-alejandro-carrillo-zucarlink',
    verificationStatus: 'verified',
    specialties: ['mantenimiento-electrico', 'energia', 'instrumentacion'],
    experiences: [
      {
        companyName: 'Ingenio El Potrero',
        roleTitle: 'Jefe de mantenimiento eléctrico',
        startDate: '2019-08-01',
        endDate: null,
        isCurrent: true,
        description:
          'Coordina mantenimiento preventivo y correctivo en subestaciones, CCM y motores críticos.',
        achievements:
          'Mejoró la planeación eléctrica previa a zafra con listas de criticidad por área.',
      },
      {
        companyName: 'Ingenio San Miguelito',
        roleTitle: 'Ingeniero eléctrico',
        startDate: '2012-06-01',
        endDate: '2019-07-31',
        isCurrent: false,
        description:
          'Ejecutó diagnósticos eléctricos y soporte a arranques de equipos mayores.',
        achievements:
          'Fortaleció rutinas de termografía y registro de incidencias.',
      },
    ],
  },
  {
    email: 'demo.valentina.paz@zucarlink.test',
    fullName: 'Valentina Paz Romero',
    country: 'Perú',
    roleTitle: 'Coordinadora de destilería',
    companyName: 'Agroindustrial Laredo',
    yearsExperience: 12,
    shortBio:
      'Coordinadora de destilería con experiencia en alcohol, balances de proceso y cumplimiento operativo.',
    phone: '',
    whatsapp: '+51 900 000 0909',
    linkedinUrl: 'https://www.linkedin.com/in/valentina-paz-romero-zucarlink',
    verificationStatus: 'pending',
    specialties: ['destileria-alcohol', 'gestion-de-agua', 'calidad'],
    experiences: [
      {
        companyName: 'Agroindustrial Laredo',
        roleTitle: 'Coordinadora de destilería',
        startDate: '2017-03-01',
        endDate: null,
        isCurrent: true,
        description:
          'Supervisa fermentación, destilación y seguimiento de indicadores de alcohol y consumo de agua.',
        achievements:
          'Estandarizó revisión diaria de pérdidas y variabilidad de fermentación.',
      },
      {
        companyName: 'Casa Grande S.A.A.',
        roleTitle: 'Supervisora de proceso',
        startDate: '2013-01-15',
        endDate: '2017-02-28',
        isCurrent: false,
        description:
          'Apoyó la operación de proceso y la coordinación entre laboratorio y destilería.',
        achievements:
          'Mejoró la trazabilidad de lotes y reportes de cierre de turno.',
      },
    ],
  },
  {
    email: 'demo.esteban.ortiz@zucarlink.test',
    fullName: 'Esteban Javier Ortiz',
    country: 'República Dominicana',
    roleTitle: 'Ingeniero de proyectos industriales',
    companyName: 'Consorcio Azucarero Central',
    yearsExperience: 6,
    shortBio:
      'Ingeniero junior de proyectos con experiencia en mejora continua, coordinación de contratistas y puesta en marcha.',
    phone: '+1 809 555 1010',
    whatsapp: '+1 809 555 1010',
    linkedinUrl: 'https://www.linkedin.com/in/esteban-javier-ortiz-zucarlink',
    verificationStatus: 'unverified',
    specialties: ['proyectos', 'automatizacion', 'mantenimiento-mecanico'],
    experiences: [
      {
        companyName: 'Consorcio Azucarero Central',
        roleTitle: 'Ingeniero de proyectos industriales',
        startDate: '2022-02-01',
        endDate: null,
        isCurrent: true,
        description:
          'Apoya ejecución de mejoras en fábrica, seguimiento de contratistas y documentación técnica.',
        achievements:
          'Ordenó cronogramas y minutas de seguimiento de proyectos menores.',
      },
      {
        companyName: 'Ingenio Porvenir',
        roleTitle: 'Analista de mantenimiento',
        startDate: '2019-01-10',
        endDate: '2022-01-31',
        isCurrent: false,
        description:
          'Soportó planeación de mantenimiento y levantamiento de requerimientos para mejoras de planta.',
        achievements:
          'Estructuró reportes base para seguimiento semanal de avances.',
      },
    ],
  },
]

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

async function ensureUser(client, profile, password) {
  const { data: userList, error: listError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    throw new Error(`No se pudo listar usuarios: ${listError.message}`)
  }

  const existingUser = userList.users.find(
    (user) => user.email?.toLowerCase() === profile.email.toLowerCase(),
  )

  const payload = {
    email: profile.email,
    password,
    email_confirm: true,
    user_metadata: {
      account_type: 'technician',
      full_name: profile.fullName,
    },
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
  }

  if (existingUser) {
    const { data: updatedUser, error: updateError } = await client.auth.admin.updateUserById(
      existingUser.id,
      payload,
    )

    if (updateError) {
      throw new Error(`No se pudo actualizar ${profile.email}: ${updateError.message}`)
    }

    return updatedUser.user
  }

  const { data: createdUser, error: createError } = await client.auth.admin.createUser(payload)

  if (createError) {
    throw new Error(`No se pudo crear ${profile.email}: ${createError.message}`)
  }

  return createdUser.user
}

async function ensureCompany(client, name, country) {
  const cleanName = name.trim()
  const cleanCountry = country.trim()

  const { data: existing, error: existingError } = await client
    .from('companies')
    .select('id, name, country')
    .eq('name', cleanName)
    .eq('country', cleanCountry)
    .maybeSingle()

  if (existingError) {
    throw new Error(`No se pudo consultar empresa ${cleanName}: ${existingError.message}`)
  }

  if (existing) {
    return existing.id
  }

  const { data: created, error: createError } = await client
    .from('companies')
    .insert({ name: cleanName, country: cleanCountry })
    .select('id')
    .single()

  if (createError) {
    throw new Error(`No se pudo crear empresa ${cleanName}: ${createError.message}`)
  }

  return created.id
}

async function loadSpecialtyMap(client) {
  const { data, error } = await client.from('specialties').select('id, slug')

  if (error) {
    throw new Error(`No se pudieron cargar especialidades: ${error.message}`)
  }

  return new Map((data ?? []).map((specialty) => [specialty.slug, specialty.id]))
}

async function syncProfile(client, userId, profile, companyId) {
  const { error } = await client.from('profiles').upsert(
    {
      id: userId,
      account_type: 'technician',
      full_name: profile.fullName,
      country: profile.country,
      role_title: profile.roleTitle,
      current_company_id: companyId,
      years_experience: profile.yearsExperience,
      short_bio: profile.shortBio,
      phone: profile.phone || null,
      whatsapp: profile.whatsapp || null,
      linkedin_url: profile.linkedinUrl || null,
      profile_status: 'complete',
      verification_status: profile.verificationStatus,
    },
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(`No se pudo actualizar perfil ${profile.email}: ${error.message}`)
  }
}

async function syncSpecialties(client, userId, specialtyMap, slugs) {
  const specialtyIds = slugs.map((slug) => {
    const specialtyId = specialtyMap.get(slug)

    if (!specialtyId) {
      throw new Error(`La especialidad ${slug} no existe. Aplica primero las migraciones.`)
    }

    return specialtyId
  })

  const { error: deleteError } = await client
    .from('profile_specialties')
    .delete()
    .eq('profile_id', userId)

  if (deleteError) {
    throw new Error(`No se pudieron limpiar especialidades del perfil ${userId}: ${deleteError.message}`)
  }

  const rows = specialtyIds.map((specialtyId) => ({
    profile_id: userId,
    specialty_id: specialtyId,
  }))

  const { error: insertError } = await client.from('profile_specialties').insert(rows)

  if (insertError) {
    throw new Error(`No se pudieron guardar especialidades del perfil ${userId}: ${insertError.message}`)
  }
}

async function syncExperiences(client, userId, country, experiences) {
  const { error: deleteError } = await client.from('experiences').delete().eq('profile_id', userId)

  if (deleteError) {
    throw new Error(`No se pudieron limpiar experiencias del perfil ${userId}: ${deleteError.message}`)
  }

  const rows = []

  for (const experience of experiences) {
    const companyId = await ensureCompany(client, experience.companyName, country)

    rows.push({
      profile_id: userId,
      company_id: companyId,
      role_title: experience.roleTitle,
      start_date: experience.startDate,
      end_date: experience.endDate,
      is_current: experience.isCurrent,
      summary: experience.description,
      description: experience.description,
      achievements: experience.achievements,
    })
  }

  const { error: insertError } = await client.from('experiences').insert(rows)

  if (insertError) {
    throw new Error(`No se pudieron guardar experiencias del perfil ${userId}: ${insertError.message}`)
  }
}

async function main() {
  loadLocalEnv()

  const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const demoPassword = process.env.WEEK5_DEMO_PASSWORD || DEFAULT_PASSWORD

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const specialtyMap = await loadSpecialtyMap(client)
  const seededUsers = []

  for (const profile of demoProfiles) {
    const user = await ensureUser(client, profile, demoPassword)
    const companyId = await ensureCompany(client, profile.companyName, profile.country)

    await syncProfile(client, user.id, profile, companyId)
    await syncSpecialties(client, user.id, specialtyMap, profile.specialties)
    await syncExperiences(client, user.id, profile.country, profile.experiences)

    seededUsers.push({
      email: profile.email,
      password: demoPassword,
      profile: profile.fullName,
    })
  }

  writeLine('Seed de Semana 5 completado.')
  writeLine(`Perfiles demo sincronizados: ${seededUsers.length}`)

  for (const user of seededUsers) {
    writeLine(`- ${user.profile} <${user.email}> | password: ${user.password}`)
  }
}

main().catch((error) => {
  writeError(error.message)
  process.exitCode = 1
})
