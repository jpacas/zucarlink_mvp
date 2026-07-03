import Anthropic from 'npm:@anthropic-ai/sdk'
import { getAdminClient } from '../../_shared/supabase-admin.ts'

const LABEL = 'Azúcar crudo NY No.11'
const MAX_SOURCES = 4
const MIN_SUMMARY_CHARS = 20

const SYSTEM_PROMPT =
  'Eres analista de mercados para una plataforma del gremio azucarero centroamericano. ' +
  'Escribes en español neutro, con tono profesional y sin sensacionalismo. ' +
  'Usa el Sistema Internacional de unidades; el azúcar crudo NY No.11 se expresa en ¢ USD/lb.'

const USER_PROMPT =
  'Busca en la web las noticias de las últimas 24–48 horas que estén moviendo el precio del ' +
  'azúcar crudo (contrato ICE No.11). Redacta un párrafo único de máximo 90 palabras explicando ' +
  'los 2–3 factores principales (por ejemplo: zafra en Brasil, monzón en India/Tailandia, ' +
  'petróleo/etanol, posiciones de fondos, clima). Sin viñetas, sin encabezados y sin cifras ' +
  'inventadas: incluye solo lo respaldado por las búsquedas.'

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

  for (const block of content) {
    if (block.type === 'text') {
      summary += block.text
      for (const citation of block.citations ?? []) {
        if ('url' in citation) addSource(citation.url, citation.title ?? undefined)
      }
    }
  }

  // Fallback: si el texto no trajo citations, usar los resultados de búsqueda.
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

export async function runMarketSummary() {
  const admin = getAdminClient()

  // La UI (FeaturedPriceCard) muestra el resumen de la fila más reciente del label destacado.
  const { data: target, error: targetError } = await admin
    .from('price_items')
    .select('id, observed_at')
    .eq('label', LABEL)
    .eq('status', 'published')
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (targetError) throw new Error(`No se pudo buscar la fila destino: ${targetError.message}`)
  if (!target) throw new Error(`No existe ninguna fila publicada con label "${LABEL}"`)

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT }],
  })

  const { summary, sources } = extractSummaryAndSources(message.content)
  if (summary.length < MIN_SUMMARY_CHARS) {
    throw new Error(`El modelo devolvió un resumen demasiado corto (${summary.length} caracteres)`)
  }

  const { error: updateError } = await admin
    .from('price_items')
    .update({
      market_summary: summary,
      market_summary_sources: sources,
      market_summary_updated_at: new Date().toISOString(),
    })
    .eq('id', target.id)
  if (updateError) throw new Error(`No se pudo guardar el resumen: ${updateError.message}`)

  return {
    ok: true,
    target_observed_at: target.observed_at,
    chars: summary.length,
    sources: sources.length,
  }
}
