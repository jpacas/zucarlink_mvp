import Anthropic from 'npm:@anthropic-ai/sdk'
import { getAdminClient } from '../../_shared/supabase-admin.ts'

const MAX_SOURCES = 4
const MIN_SUMMARY_CHARS = 20
// El prompt pide máximo 90 palabras (~600-700 caracteres en español); un texto
// mucho más largo es señal de que el modelo devolvió meta-conversación.
const MAX_SUMMARY_CHARS = 800
// Frases que delatan que el modelo respondió sobre sus herramientas o límites
// en vez de entregar el análisis (p. ej. cuando web_search agota su cuota).
const META_TEXT_PATTERN =
  /l[ií]mite de b[uú]squedas|l[ií]mite del uso|herramienta de b[uú]squeda|reintentar la b[uú]squeda|env[ií]eme un nuevo mensaje|no puedo (?:completar|redactar)/i

const SYSTEM_PROMPT =
  'Eres analista de mercados para una plataforma del gremio azucarero centroamericano. ' +
  'Escribes en español neutro, con tono profesional y sin sensacionalismo. ' +
  'Usa el Sistema Internacional de unidades.'

interface LabelConfig {
  label: string
  userPrompt: string
}

const LABELS: LabelConfig[] = [
  {
    label: 'Azúcar crudo NY No.11',
    userPrompt:
      'Busca en la web las noticias más relevantes de la última semana que estén moviendo el ' +
      'precio del azúcar crudo (contrato ICE No.11, cotizado en ¢ USD/lb). Redacta un párrafo ' +
      'único de máximo 90 palabras explicando los 2–3 factores principales (por ejemplo: zafra ' +
      'en Brasil, monzón en India/Tailandia, petróleo/etanol, posiciones de fondos, clima). Sin ' +
      'viñetas, sin encabezados y sin cifras inventadas: incluye solo lo respaldado por las búsquedas.',
  },
  {
    label: 'Azúcar refinada',
    userPrompt:
      'Busca en la web las noticias más relevantes de la última semana que estén moviendo el ' +
      'precio del azúcar blanca/refinada (contrato ICE White Sugar No.5, cotizado en USD/t). ' +
      'Redacta un párrafo único de máximo 90 palabras explicando los 2–3 factores principales ' +
      '(por ejemplo: spread crudo-refinado, demanda asiática, oferta europea, fletes, clima). Sin ' +
      'viñetas, sin encabezados y sin cifras inventadas: incluye solo lo respaldado por las búsquedas.',
  },
]

interface SummarySource {
  label: string
  url: string
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function extractSummaryAndSources(content: Anthropic.ContentBlock[]) {
  let summary = ''
  const sources: SummarySource[] = []
  const seen = new Set<string>()

  const addSource = (url: string | undefined, title: string | undefined) => {
    if (!url || seen.has(url) || sources.length >= MAX_SOURCES) return
    seen.add(url)
    sources.push({ label: title?.trim() || hostname(url), url })
  }

  const lastToolResultIndex = content.reduce(
    (lastIndex, block, index) => (block.type === 'web_search_tool_result' ? index : lastIndex),
    -1,
  )

  for (const [index, block] of content.entries()) {
    if (block.type === 'text' && index > lastToolResultIndex) {
      summary += block.text
      for (const citation of block.citations ?? []) {
        if ('url' in citation) addSource(citation.url, citation.title ?? undefined)
      }
    }
  }

  if (sources.length === 0) {
    for (const block of content) {
      if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const result of block.content) {
          if (result.type === 'web_search_result') addSource(result.url, result.title)
        }
      }
    }
  }

  return { summary: summary.trim(), sources }
}

function currentWeekRange(): { periodStart: string; periodEnd: string } {
  const now = new Date()
  const day = now.getUTCDay() // 0 = domingo ... 1 = lunes
  const diffToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diffToMonday)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return {
    periodStart: monday.toISOString().slice(0, 10),
    periodEnd: sunday.toISOString().slice(0, 10),
  }
}

async function runForLabel(anthropic: Anthropic, config: LabelConfig) {
  const { periodStart, periodEnd } = currentWeekRange()
  const admin = getAdminClient()

  // Sonnet en vez de Opus, y menos búsquedas: un resumen de 90 palabras no
  // necesita el modelo más pesado, y la invocación completa debe caber en el
  // límite de idle timeout (150s) de la Edge Function.
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 512,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2 }],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: config.userPrompt }],
  })

  const { summary, sources } = extractSummaryAndSources(message.content)
  if (summary.length < MIN_SUMMARY_CHARS) {
    throw new Error(
      `El modelo devolvió un resumen demasiado corto para "${config.label}" (${summary.length} caracteres)`,
    )
  }
  if (summary.length > MAX_SUMMARY_CHARS) {
    throw new Error(
      `El modelo devolvió un resumen demasiado largo para "${config.label}" (${summary.length} caracteres)`,
    )
  }
  if (META_TEXT_PATTERN.test(summary)) {
    throw new Error(
      `El modelo devolvió meta-conversación en vez de análisis para "${config.label}"`,
    )
  }

  const { error: upsertError } = await admin.from('price_market_summaries').upsert(
    {
      label: config.label,
      period_start: periodStart,
      period_end: periodEnd,
      summary,
      sources,
    },
    { onConflict: 'label,period_start' },
  )
  if (upsertError) {
    throw new Error(`No se pudo guardar el resumen de "${config.label}": ${upsertError.message}`)
  }

  return { label: config.label, period_start: periodStart, chars: summary.length, sources: sources.length }
}

export async function runMarketSummary(options: { label?: string } = {}) {
  const anthropic = new Anthropic()

  const targets = options.label
    ? LABELS.filter((config) => config.label === options.label)
    : LABELS
  if (targets.length === 0) {
    throw new Error(`Label desconocido para el resumen de mercado: "${options.label}"`)
  }

  // Cada label es una invocación independiente a Anthropic con web_search
  // (I/O-bound, puede tardar cerca del límite de idle timeout de 150s de la
  // Edge Function). Correrlas en paralelo dentro de un mismo request seguía
  // arriesgando ese límite con 2+ labels, así que el caller (index.ts /
  // el cron) dispara un request por label en vez de todo junto.
  const results = await Promise.all(
    targets.map((config) =>
      runForLabel(anthropic, config).catch((error) => ({
        label: config.label,
        ok: false,
        error: String(error),
      })),
    ),
  )

  return { ok: results.every((r) => !('ok' in r) || r.ok !== false), results }
}
