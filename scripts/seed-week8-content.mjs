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

const contentItems = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    type: 'news',
    title: 'Perspectiva regional de producción de azúcar para Centroamérica 2026',
    slug: 'perspectiva-regional-produccion-azucar-centroamerica-2026',
    summary: 'Panorama curado de expectativas productivas y señales de mercado para ingenios y actores del sector.',
    body: 'Zucarlink resume señales de producción regional, presión operativa y focos de atención para la próxima zafra en Centroamérica.',
    category: 'Mercado',
    country: 'Latinoamérica',
    source_name: 'International Sugar Organization',
    source_url: 'https://example.com/iso-centroamerica-2026',
    cover_image_url: null,
    published_at: '2026-04-10T12:00:00.000Z',
    tags: ['azúcar', 'latinoamérica'],
    is_featured: true,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    type: 'news',
    title: 'Nuevas inversiones en cogeneración vuelven a ganar espacio en ingenios de la región',
    slug: 'nuevas-inversiones-cogeneracion-ingenios-region',
    summary: 'Resumen de señales de inversión energética y por qué importan para eficiencia y estabilidad operativa.',
    body: 'La cogeneración sigue apareciendo como palanca de eficiencia, resiliencia energética y reputación industrial en varios mercados azucareros.',
    category: 'Energía',
    country: 'Latinoamérica',
    source_name: 'Bioenergy Insight',
    source_url: 'https://example.com/cogeneracion-region',
    cover_image_url: null,
    published_at: '2026-04-11T12:00:00.000Z',
    tags: ['cogeneración', 'ingenios'],
    is_featured: true,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    type: 'news',
    title: 'Ajustes regulatorios en biocombustibles podrían mover decisiones comerciales de etanol',
    slug: 'ajustes-regulatorios-biocombustibles-decisiones-comerciales-etanol',
    summary: 'Lectura breve sobre cambios regulatorios y su impacto para productores vinculados a etanol y energía.',
    body: 'Cambios de política pueden alterar incentivos, mezcla y ritmo de inversión; el seguimiento regulatorio vuelve a ser operativo, no solo legal.',
    category: 'Regulación',
    country: 'Brasil',
    source_name: 'USDA FAS',
    source_url: 'https://example.com/regulacion-etanol',
    cover_image_url: null,
    published_at: '2026-04-12T12:00:00.000Z',
    tags: ['etanol', 'regulación'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    type: 'news',
    title: 'Ingenios aceleran digitalización de mantenimiento para reducir reincidencia de fallas',
    slug: 'ingenios-aceleran-digitalizacion-mantenimiento-reducir-reincidencia-fallas',
    summary: 'Curación de iniciativas de mantenimiento y por qué las mejoras pequeñas están generando retorno visible.',
    body: 'La digitalización operativa ya no solo apunta a grandes proyectos; varias mejoras pequeñas están mejorando disciplina y trazabilidad.',
    category: 'Mantenimiento',
    country: 'Latinoamérica',
    source_name: 'Sugar Industry Journal',
    source_url: 'https://example.com/mantenimiento-digital',
    cover_image_url: null,
    published_at: '2026-04-13T12:00:00.000Z',
    tags: ['mantenimiento', 'eficiencia'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    type: 'news',
    title: 'Lluvias y calidad de caña vuelven a presionar protocolos de recepción en varios ingenios',
    slug: 'lluvias-calidad-cana-presionan-protocolos-recepcion-ingenios',
    summary: 'Síntesis de cómo el clima impacta decisiones operativas de patio, preparación y extracción.',
    body: 'El efecto de la humedad sobre materia prima y estabilidad de fábrica vuelve a poner foco en protocolos reales más que en manuales ideales.',
    category: 'Agrícola',
    country: 'Centroamérica',
    source_name: 'Asociación de Técnicos Azucareros',
    source_url: 'https://example.com/lluvias-cana',
    cover_image_url: null,
    published_at: '2026-04-14T12:00:00.000Z',
    tags: ['caña', 'molienda'],
    is_featured: true,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    type: 'news',
    title: 'Avances en automatización de lazos críticos empiezan a verse fuera de los grandes ingenios',
    slug: 'avances-automatizacion-lazos-criticos-fuera-grandes-ingenios',
    summary: 'Panorama de adopción más accesible de instrumentación y control en operaciones azucareras.',
    body: 'La automatización deja de ser exclusiva de megaproyectos y empieza a entrar por mejoras puntuales con impacto tangible.',
    category: 'Automatización',
    country: 'Latinoamérica',
    source_name: 'Automation World',
    source_url: 'https://example.com/automatizacion-lazos',
    cover_image_url: null,
    published_at: '2026-04-15T12:00:00.000Z',
    tags: ['automatización', 'ingenios'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    type: 'news',
    title: 'Señales de recuperación del precio internacional reactivan conversación comercial del sector',
    slug: 'senales-recuperacion-precio-internacional-reactivan-conversacion-comercial-sector',
    summary: 'Lectura rápida del entorno de precio y cómo puede cambiar expectativas de mercado y negociación.',
    body: 'El repunte de referencias internacionales puede alterar decisiones comerciales, cobertura y percepción de riesgo para varias operaciones.',
    category: 'Mercado',
    country: 'Global',
    source_name: 'Reuters Commodities',
    source_url: 'https://example.com/precio-internacional',
    cover_image_url: null,
    published_at: '2026-04-16T12:00:00.000Z',
    tags: ['azúcar', 'mercado'],
    is_featured: true,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    type: 'news',
    title: 'Sostenibilidad y trazabilidad pasan de discurso a requisito comercial en varios mercados',
    slug: 'sostenibilidad-trazabilidad-pasan-discurso-requisito-comercial',
    summary: 'Resumen de cómo sostenibilidad y trazabilidad ya afectan acceso a mercado y narrativa comercial.',
    body: 'Las exigencias de trazabilidad y sostenibilidad están dejando de ser opcionales y empiezan a influir en decisiones de operación y reputación.',
    category: 'Sostenibilidad',
    country: 'Latinoamérica',
    source_name: 'Sustainable Brands',
    source_url: 'https://example.com/sostenibilidad-trazabilidad',
    cover_image_url: null,
    published_at: '2026-04-17T12:00:00.000Z',
    tags: ['sostenibilidad', 'latinoamérica'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    type: 'blog',
    title: 'Qué hace útil una noticia técnica para un ingenio y qué solo genera ruido',
    slug: 'que-hace-util-una-noticia-tecnica-ingenio-y-que-solo-genera-ruido',
    summary: 'Marco editorial propio para separar información operativa de contenido sin valor real.',
    body: 'Zucarlink propone leer noticias con filtro operativo: impacto en producción, energía, mantenimiento, regulación o mercado real.',
    category: 'Innovación',
    country: 'Latinoamérica',
    source_name: 'Zucarlink',
    source_url: 'https://zucarlink.example/blog/criterio-editorial',
    cover_image_url: null,
    published_at: '2026-04-09T12:00:00.000Z',
    tags: ['eficiencia', 'latinoamérica'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    type: 'blog',
    title: 'Cómo leer eventos del sector sin perder tiempo en agenda irrelevante',
    slug: 'como-leer-eventos-sector-sin-perder-tiempo-agenda-irrelevante',
    summary: 'Guía breve para decidir qué congresos merecen atención según objetivo técnico o comercial.',
    body: 'No todo evento aporta igual; esta pieza resume criterios para filtrar congresos por retorno técnico, contactos y aplicabilidad.',
    category: 'Eventos',
    country: 'Latinoamérica',
    source_name: 'Zucarlink',
    source_url: 'https://zucarlink.example/blog/filtrar-eventos',
    cover_image_url: null,
    published_at: '2026-04-10T15:00:00.000Z',
    tags: ['eventos', 'ingenios'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    type: 'blog',
    title: 'Por qué pequeños cambios en automatización suelen ser más viables que megaproyectos',
    slug: 'por-que-pequenos-cambios-automatizacion-suelen-ser-mas-viables-que-megaproyectos',
    summary: 'Análisis corto sobre adopción gradual de automatización y retorno visible en ingenios.',
    body: 'La adopción incremental reduce fricción, acelera aprendizaje y facilita resultados medibles frente a proyectos demasiado ambiciosos.',
    category: 'Automatización',
    country: 'Latinoamérica',
    source_name: 'Zucarlink',
    source_url: 'https://zucarlink.example/blog/automatizacion-incremental',
    cover_image_url: null,
    published_at: '2026-04-12T15:00:00.000Z',
    tags: ['automatización', 'eficiencia'],
    is_featured: false,
    status: 'published',
  },
  {
    id: '10000000-0000-4000-8000-000000000012',
    type: 'blog',
    title: 'Qué indicadores de precio sí vale la pena seguir cada semana en Zucarlink',
    slug: 'que-indicadores-precio-si-vale-la-pena-seguir-cada-semana-en-zucarlink',
    summary: 'Explica el alcance del bloque de precios y por qué la curación importa más que el volumen.',
    body: 'Semana 8 no busca un terminal de mercado; busca indicadores de referencia que ayuden a orientar lectura sectorial y conversación.',
    category: 'Mercado',
    country: 'Global',
    source_name: 'Zucarlink',
    source_url: 'https://zucarlink.example/blog/indicadores-utiles',
    cover_image_url: null,
    published_at: '2026-04-13T15:00:00.000Z',
    tags: ['mercado', 'azúcar'],
    is_featured: false,
    status: 'published',
  },
]

const events = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    title: 'Congreso Latinoamericano de Caña y Azúcar 2026',
    slug: 'congreso-latinoamericano-cana-azucar-2026',
    summary: 'Encuentro regional enfocado en producción, eficiencia y networking sectorial.',
    start_date: '2026-06-18',
    end_date: '2026-06-20',
    city: 'Cali',
    country: 'Colombia',
    organizer: 'Asociación Latinoamericana del Azúcar',
    source_url: 'https://example.com/evento-latam',
    cover_image_url: null,
    tags: ['eventos', 'latinoamérica'],
    status: 'published',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    title: 'Foro Técnico de Energía y Cogeneración en Ingenios',
    slug: 'foro-tecnico-energia-cogeneracion-ingenios',
    summary: 'Agenda dedicada a eficiencia térmica, vapor y generación de valor energético.',
    start_date: '2026-07-08',
    end_date: '2026-07-09',
    city: 'San Pedro Sula',
    country: 'Honduras',
    organizer: 'Cámara de Energía Industrial',
    source_url: 'https://example.com/foro-energia',
    cover_image_url: null,
    tags: ['cogeneración', 'eventos'],
    status: 'published',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    title: 'Expo Automatización para Agroindustria 2026',
    slug: 'expo-automatizacion-agroindustria-2026',
    summary: 'Evento orientado a control, instrumentación y digitalización aplicada.',
    start_date: '2026-08-12',
    end_date: '2026-08-14',
    city: 'Ciudad de Guatemala',
    country: 'Guatemala',
    organizer: 'Expo Industria',
    source_url: 'https://example.com/expo-automatizacion',
    cover_image_url: null,
    tags: ['automatización', 'eventos'],
    status: 'published',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    title: 'Encuentro de Innovación Azucarera y Bioenergía',
    slug: 'encuentro-innovacion-azucarera-bioenergia',
    summary: 'Espacio para discutir innovación, sostenibilidad y diversificación energética.',
    start_date: '2026-09-03',
    end_date: '2026-09-04',
    city: 'Recife',
    country: 'Brasil',
    organizer: 'Red Bioenergía',
    source_url: 'https://example.com/innovacion-bioenergia',
    cover_image_url: null,
    tags: ['bioenergía', 'eventos'],
    status: 'published',
  },
]

const priceItems = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    label: 'Azúcar crudo',
    value: '23.10',
    unit: 'USD/lb',
    observed_at: '2026-04-14',
    source_name: 'ICE',
    source_url: 'https://example.com/precio-azucar-crudo',
    notes: 'Referencia curada para seguimiento semanal.',
    status: 'published',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    label: 'Azúcar refinada',
    value: '640.00',
    unit: 'USD/t',
    observed_at: '2026-04-14',
    source_name: 'Market Reference',
    source_url: 'https://example.com/precio-azucar-refinada',
    notes: 'Indicador orientativo para lectura de mercado.',
    status: 'published',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    label: 'Etanol',
    value: '2.40',
    unit: 'USD/gal',
    observed_at: '2026-04-16',
    source_name: 'B3',
    source_url: 'https://example.com/precio-etanol',
    notes: 'Referencia útil para conversaciones energéticas y comerciales.',
    status: 'published',
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    label: 'Energía eléctrica spot',
    value: '118.00',
    unit: 'USD/MWh',
    observed_at: '2026-04-15',
    source_name: 'Mercado regional',
    source_url: 'https://example.com/precio-energia',
    notes: 'Indicador curado, no feed en tiempo real.',
    status: 'published',
  },
]

async function upsertContentItems() {
  const { error } = await supabase.from('content_items').upsert(contentItems, {
    onConflict: 'id',
  })

  if (error) {
    throw error
  }
}

async function upsertEvents() {
  const { error } = await supabase.from('events').upsert(events, {
    onConflict: 'id',
  })

  if (error) {
    throw error
  }
}

async function upsertPriceItems() {
  const { error } = await supabase.from('price_items').upsert(priceItems, {
    onConflict: 'id',
  })

  if (error) {
    throw error
  }
}

async function main() {
  await upsertContentItems()
  await upsertEvents()
  await upsertPriceItems()

  console.log(`Seed Semana 8 listo: ${contentItems.length + events.length + priceItems.length} piezas.`)
}

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de Semana 8.')
  console.error(error)
  process.exit(1)
})
