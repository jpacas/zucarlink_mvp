import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const DEFAULT_PASSWORD = 'ZucarlinkForum2026!'

const authors = [
  {
    email: 'foro.ana.mejia@zucarlink.test',
    fullName: 'Ana Mejía',
    country: 'El Salvador',
    roleTitle: 'Jefa de automatización',
    companyName: 'Ingenio El Carmen',
    shortBio: 'Automatización aplicada a molienda y estabilidad de proceso.',
    verificationStatus: 'verified',
  },
  {
    email: 'foro.carlos.ruiz@zucarlink.test',
    fullName: 'Carlos Ruiz',
    country: 'Guatemala',
    roleTitle: 'Supervisor de calderas',
    companyName: 'Ingenio San Miguel',
    shortBio: 'Operación térmica, vapor y control de pérdidas energéticas.',
    verificationStatus: 'unverified',
  },
  {
    email: 'foro.lucia.paredes@zucarlink.test',
    fullName: 'Lucía Paredes',
    country: 'México',
    roleTitle: 'Especialista en automatización',
    companyName: 'Ingenio del Pacífico',
    shortBio: 'PLC, sensórica e instrumentación crítica para ingenios.',
    verificationStatus: 'verified',
  },
]

const categories = [
  { slug: 'molienda', name: 'Molienda', description: 'Preparación de caña, tándem y pérdidas en extracción.', sort_order: 10, is_active: true },
  { slug: 'extraccion', name: 'Extracción', description: 'Balance de sacarosa, imbibición y eficiencia de proceso.', sort_order: 20, is_active: true },
  { slug: 'agricola', name: 'Agrícola', description: 'Campo, riego, cosecha y calidad de materia prima.', sort_order: 30, is_active: true },
  { slug: 'mantenimiento', name: 'Mantenimiento', description: 'Confiabilidad, paros y mantenimiento mecánico o eléctrico.', sort_order: 40, is_active: true },
  { slug: 'energia', name: 'Energía', description: 'Vapor, calderas, cogeneración y eficiencia térmica.', sort_order: 50, is_active: true },
  { slug: 'automatizacion', name: 'Automatización', description: 'PLC, instrumentación, datos y control avanzado.', sort_order: 60, is_active: true },
]

const threads = [
  {
    slug: 'automatizacion-mano-de-obra-barata',
    title: '¿Vale la pena invertir en automatización cuando la mano de obra en Latinoamérica sigue siendo barata?',
    body: 'Quiero comparar retornos reales entre automatizaciones pequeñas, estabilidad operativa y ahorro por menos variabilidad en turnos. ¿Qué sí les ha pagado y qué no?',
    categorySlug: 'automatizacion',
    authorEmail: 'foro.ana.mejia@zucarlink.test',
  },
  {
    slug: 'molienda-con-lluvia-protocolo-real',
    title: 'Molienda con lluvia: ¿cuál es su protocolo real cuando llega caña con exceso de humedad?',
    body: 'Más allá del manual, ¿qué ajustes hacen en patio, preparación y tándem cuando la humedad sube de golpe y amenaza extracción o estabilidad?',
    categorySlug: 'molienda',
    authorEmail: 'foro.carlos.ruiz@zucarlink.test',
  },
  {
    slug: 'settings-de-molinos-recetas-o-parametros',
    title: 'Settings de molinos: ¿cada ingenio tiene su propia receta o hay parámetros universales?',
    body: 'Quiero contrastar si existen ventanas operativas realmente transferibles entre ingenios o si todo depende de materia prima, tándem y disciplina de turno.',
    categorySlug: 'molienda',
    authorEmail: 'foro.carlos.ruiz@zucarlink.test',
  },
  {
    slug: 'mano-de-obra-calificada-en-zafra',
    title: 'Falta de mano de obra calificada en zafra: ¿cómo lo están resolviendo?',
    body: 'Entre rotación, entrenamiento acelerado y presión por resultados, ¿qué estrategias les han funcionado para sostener calidad de operación durante zafra?',
    categorySlug: 'mantenimiento',
    authorEmail: 'foro.lucia.paredes@zucarlink.test',
  },
  {
    slug: 'quimicos-sobredosificacion-o-protocolo',
    title: 'Uso de químicos en el proceso: ¿hay sobredosificación por seguridad o protocolos precisos?',
    body: 'Me interesa entender qué tanto se dosifica por costumbre versus por control disciplinado con indicadores confiables y seguimiento real.',
    categorySlug: 'extraccion',
    authorEmail: 'foro.ana.mejia@zucarlink.test',
  },
  {
    slug: 'tiempos-perdidos-en-preparacion-de-cana',
    title: 'Mejores prácticas para reducir tiempos perdidos en preparación de caña',
    body: '¿Qué cambios operativos o de mantenimiento les han recortado microparos y pérdidas de ritmo en cuchillas, fibrizadores o transportadores?',
    categorySlug: 'extraccion',
    authorEmail: 'foro.carlos.ruiz@zucarlink.test',
  },
  {
    slug: 'balance-de-vapor-en-humedad-alta',
    title: 'Balance de vapor en días de alta humedad: ¿qué variable ajustan primero?',
    body: 'Cuando la humedad externa y de caña complica estabilidad, ¿qué variable priorizan para proteger eficiencia térmica sin castigar producción?',
    categorySlug: 'energia',
    authorEmail: 'foro.carlos.ruiz@zucarlink.test',
  },
  {
    slug: 'mantenimiento-predictivo-con-retorno-real',
    title: 'Mantenimiento predictivo en fábrica: ¿qué sí les ha dado retorno real?',
    body: 'Estoy buscando ejemplos concretos de sensado, análisis de vibración o rutinas predictivas que sí hayan reducido fallas repetitivas o paros mayores.',
    categorySlug: 'mantenimiento',
    authorEmail: 'foro.lucia.paredes@zucarlink.test',
  },
  {
    slug: 'indicadores-agricolas-para-anticipar-mala-cana',
    title: 'Indicadores agrícolas que mejor anticipan una mala calidad de caña',
    body: '¿Qué señales tempranas sí les sirven para anticipar deterioro de calidad antes de que golpee recepción y fábrica?',
    categorySlug: 'agricola',
    authorEmail: 'foro.ana.mejia@zucarlink.test',
  },
  {
    slug: 'automatizaciones-pequenas-con-mayor-impacto',
    title: '¿Qué automatizaciones pequeñas han generado el mayor impacto en su ingenio?',
    body: 'No me refiero a megaproyectos. Busco automatizaciones acotadas que hayan mejorado disciplina operativa, visibilidad o estabilidad con baja inversión.',
    categorySlug: 'automatizacion',
    authorEmail: 'foro.lucia.paredes@zucarlink.test',
  },
]

const replies = [
  {
    threadSlug: 'automatizacion-mano-de-obra-barata',
    authorEmail: 'foro.carlos.ruiz@zucarlink.test',
    body: 'Nos pagó primero en consistencia de turno, no tanto en reducción directa de personal. La caída de variabilidad sí justificó la inversión.',
  },
  {
    threadSlug: 'balance-de-vapor-en-humedad-alta',
    authorEmail: 'foro.ana.mejia@zucarlink.test',
    body: 'Nosotros tocamos primero el control de combustión y después revisamos puntos de consumo. Si ajustas consumo antes, terminas persiguiendo síntomas.',
  },
]

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const raw = readFileSync(filePath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, '$1')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

for (const envFile of ['.env.local', '.env', '.env.development.local']) {
  loadEnvFile(path.join(projectRoot, envFile))
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const demoPassword = process.env.WEEK7_FORUM_PASSWORD ?? DEFAULT_PASSWORD

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan SUPABASE_URL/VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function ensureCompany(companyName, country) {
  const { data: existing, error: existingError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', companyName)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return existing.id
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: companyName,
      country,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data.id
}

async function findAuthUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (error) {
    throw error
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureAuthor(author) {
  let user = await findAuthUserByEmail(author.email)

  if (!user) {
    const created = await supabase.auth.admin.createUser({
      email: author.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        account_type: 'technician',
        full_name: author.fullName,
        profile_status: 'complete',
      },
    })

    if (created.error) {
      throw created.error
    }

    user = created.data.user
  } else {
    const updated = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        account_type: 'technician',
        full_name: author.fullName,
        profile_status: 'complete',
      },
    })

    if (updated.error) {
      throw updated.error
    }

    user = updated.data.user
  }

  const companyId = await ensureCompany(author.companyName, author.country)

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      account_type: 'technician',
      full_name: author.fullName,
      country: author.country,
      role_title: author.roleTitle,
      current_company_id: companyId,
      years_experience: 8,
      short_bio: author.shortBio,
      avatar_path: null,
      profile_status: 'complete',
      verification_status: author.verificationStatus,
    },
    { onConflict: 'id' },
  )

  if (profileError) {
    throw profileError
  }

  return user
}

async function seedCategories() {
  const { error } = await supabase.from('forum_categories').upsert(categories, {
    onConflict: 'slug',
  })

  if (error) {
    throw error
  }
}

async function mapCategoryIds() {
  const { data, error } = await supabase
    .from('forum_categories')
    .select('id, slug')
    .in(
      'slug',
      categories.map((category) => category.slug),
    )

  if (error) {
    throw error
  }

  return new Map((data ?? []).map((item) => [item.slug, item.id]))
}

async function seedThreads(authorIdsByEmail, categoryIdsBySlug) {
  const payload = threads.map((thread) => ({
    slug: thread.slug,
    title: thread.title,
    body: thread.body,
    category_id: categoryIdsBySlug.get(thread.categorySlug),
    author_id: authorIdsByEmail.get(thread.authorEmail),
    status: 'published',
    reply_count: 0,
    last_activity_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('forum_topics').upsert(payload, {
    onConflict: 'slug',
  })

  if (error) {
    throw error
  }
}

async function seedReplies(authorIdsByEmail) {
  const { data: topicRows, error: topicError } = await supabase
    .from('forum_topics')
    .select('id, slug')
    .in(
      'slug',
      replies.map((reply) => reply.threadSlug),
    )

  if (topicError) {
    throw topicError
  }

  const topicIdsBySlug = new Map((topicRows ?? []).map((item) => [item.slug, item.id]))

  for (const reply of replies) {
    const topicId = topicIdsBySlug.get(reply.threadSlug)
    const authorId = authorIdsByEmail.get(reply.authorEmail)

    if (!topicId || !authorId) {
      continue
    }

    const { count, error: countError } = await supabase
      .from('forum_replies')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .eq('author_id', authorId)

    if (countError) {
      throw countError
    }

    if ((count ?? 0) > 0) {
      continue
    }

    const { error } = await supabase.from('forum_replies').insert({
      topic_id: topicId,
      author_id: authorId,
      body: reply.body,
      status: 'published',
    })

    if (error) {
      throw error
    }
  }
}

async function main() {
  const authorIdsByEmail = new Map()

  for (const author of authors) {
    const user = await ensureAuthor(author)
    authorIdsByEmail.set(author.email, user.id)
  }

  await seedCategories()
  const categoryIdsBySlug = await mapCategoryIds()
  await seedThreads(authorIdsByEmail, categoryIdsBySlug)
  await seedReplies(authorIdsByEmail)

  console.log('Week 7 forum seed complete.')
  console.log(`Authors: ${authorIdsByEmail.size}`)
  console.log(`Categories: ${categories.length}`)
  console.log(`Threads: ${threads.length}`)
  console.log(`Replies: ${replies.length}`)
}

main().catch((error) => {
  console.error('Week 7 forum seed failed.')
  console.error(error?.message ?? error)
  process.exit(1)
})
