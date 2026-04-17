import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const DEFAULT_PASSWORD = 'ZucarlinkProviders2026!'

const categories = [
  { slug: 'automatizacion', name: 'Automatización' },
  { slug: 'laboratorio', name: 'Laboratorio' },
  { slug: 'quimicos', name: 'Químicos' },
  { slug: 'equipos', name: 'Equipos' },
  { slug: 'servicios-tecnicos', name: 'Servicios técnicos' },
]

const providers = [
  {
    email: 'demo.tecno.control@zucarlink.test',
    fullName: 'Laura Méndez',
    companyName: 'Tecno Control',
    categorySlug: 'automatizacion',
    shortDescription: 'Automatización industrial y monitoreo remoto para ingenios.',
    longDescription:
      'Integra PLC, sensórica e instrumentación para control continuo de procesos críticos en fábrica.',
    countries: ['El Salvador', 'Guatemala'],
    productsServices: ['PLC', 'SCADA', 'Instrumentación'],
    website: 'https://tecnocontrol.example.com',
    contactEmail: 'contacto@tecnocontrol.example.com',
  },
  {
    email: 'demo.lab.cana@zucarlink.test',
    fullName: 'Julio Rojas',
    companyName: 'Lab Caña',
    categorySlug: 'laboratorio',
    shortDescription: 'Servicios de laboratorio, análisis y soporte de calidad.',
    longDescription:
      'Soporta laboratorios de proceso, azúcar final y control de insumos para operación de zafra.',
    countries: ['México', 'Honduras'],
    productsServices: ['Análisis de laboratorio', 'Calibración', 'Capacitación'],
    website: 'https://labcana.example.com',
    contactEmail: 'ventas@labcana.example.com',
  },
  {
    email: 'demo.quimica.industrial@zucarlink.test',
    fullName: 'María Estrada',
    companyName: 'Química Industrial Caña',
    categorySlug: 'quimicos',
    shortDescription: 'Tratamientos químicos para fábrica, calderas y agua.',
    longDescription:
      'Atiende requerimientos de clarificación, calderas y tratamiento de agua con acompañamiento técnico.',
    countries: ['Nicaragua', 'Costa Rica'],
    productsServices: ['Clarificación', 'Tratamiento de agua', 'Calderas'],
    website: 'https://quimicacana.example.com',
    contactEmail: 'asesoria@quimicacana.example.com',
  },
  {
    email: 'demo.equipos.zafra@zucarlink.test',
    fullName: 'Héctor Fuentes',
    companyName: 'Equipos Zafra',
    categorySlug: 'equipos',
    shortDescription: 'Equipos, repuestos y soporte para molienda y patio de caña.',
    longDescription:
      'Suministra equipos críticos y repuestos con soporte técnico para montaje, arranque y mantenimiento.',
    countries: ['Colombia', 'Panamá'],
    productsServices: ['Bombas', 'Repuestos', 'Montaje'],
    website: 'https://equiposzafra.example.com',
    contactEmail: 'comercial@equiposzafra.example.com',
  },
  {
    email: 'demo.ingenieria.campo@zucarlink.test',
    fullName: 'Andrea Solís',
    companyName: 'Ingeniería de Campo',
    categorySlug: 'servicios-tecnicos',
    shortDescription: 'Servicios técnicos y consultoría aplicada para operación agrícola e industrial.',
    longDescription:
      'Acompaña proyectos de mejora, levantamiento técnico y soporte en implementación de prácticas operativas.',
    countries: ['El Salvador', 'República Dominicana'],
    productsServices: ['Consultoría', 'Puesta en marcha', 'Acompañamiento técnico'],
    website: 'https://ingenieriadecampo.example.com',
    contactEmail: 'proyectos@ingenieriadecampo.example.com',
  },
]

function getEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }

  return value
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const password = process.env.WEEK9_PROVIDER_PASSWORD || DEFAULT_PASSWORD

  if (!url) {
    throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL')
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: categoryRows, error: categoryError } = await supabase
    .from('provider_categories')
    .upsert(categories, { onConflict: 'slug' })
    .select('id, slug, name')

  if (categoryError) {
    throw categoryError
  }

  const categoriesBySlug = new Map(categoryRows.map((row) => [row.slug, row]))
  const { data: listedUsers, error: listUsersError } = await supabase.auth.admin.listUsers()

  if (listUsersError) {
    throw listUsersError
  }

  const usersByEmail = new Map(
    (listedUsers.users || []).map((user) => [user.email?.toLowerCase(), user]),
  )

  for (const provider of providers) {
    let user = usersByEmail.get(provider.email.toLowerCase()) ?? null

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: provider.email,
        password,
        email_confirm: true,
        user_metadata: {
          account_type: 'provider',
          full_name: provider.fullName,
        },
      })

      if (error) {
        throw error
      }

      user = data.user
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        account_type: 'provider',
        full_name: provider.fullName,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      throw profileError
    }

    const category = categoriesBySlug.get(provider.categorySlug)

    if (!category) {
      throw new Error(`Missing category for slug ${provider.categorySlug}`)
    }

    const { error: providerError } = await supabase.from('providers').upsert(
      {
        owner_id: user.id,
        slug: slugify(provider.companyName),
        company_name: provider.companyName,
        category_id: category.id,
        short_description: provider.shortDescription,
        long_description: provider.longDescription,
        countries: provider.countries,
        products_services: provider.productsServices,
        website: provider.website,
        contact_email: provider.contactEmail,
        status: 'active',
        is_verified: true,
      },
      { onConflict: 'owner_id' },
    )

    if (providerError) {
      throw providerError
    }

    console.log(`seeded provider ${provider.companyName}`)
  }

  console.log(`done. default password: ${password}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
