import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { BROWSER_UA } from '../../_shared/browser-ua.ts'

// ICE White Sugar #5 (Londres) cotiza en USD por tonelada métrica.
const LABEL = 'Azúcar refinada'
const UNIT = 'USD/t'
const NOTES = 'Cierre diario scrapeado de Investing.com (dato retrasado, no feed en tiempo real).'
const SOURCE_NAME = 'ICE White Sugar #5 (Londres) / Investing.com'
const SOURCE_URL = 'https://www.investing.com/commodities/london-sugar'
// ~5 años de historial para el gráfico de precio clave.
const RETENTION_DAYS = 1900

interface RefinedPricePoint {
  observedAt: string // YYYY-MM-DD, tomado del atributo dateTime de Investing.com
  value: number
}

async function fetchInvestingRefinedPrice(): Promise<RefinedPricePoint> {
  const res = await fetch(SOURCE_URL, { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) throw new Error(`Investing.com respondió ${res.status}`)
  const html = await res.text()

  const priceMatch = html.match(/data-test="instrument-price-last"[^>]*>([\d.,]+)</)
  if (!priceMatch) {
    throw new Error('Investing.com: no se encontró data-test="instrument-price-last" en el HTML')
  }
  const value = Number.parseFloat(priceMatch[1].replace(/,/g, ''))
  if (!Number.isFinite(value)) {
    throw new Error(`Investing.com: precio inválido "${priceMatch[1]}"`)
  }

  const timeTagMatch = html.match(/<time[^>]*data-test="trading-time-label"[^>]*>/)
  const dateTimeMatch = timeTagMatch?.[0]?.match(/dateTime="([^"]+)"/)
  if (!dateTimeMatch) {
    throw new Error('Investing.com: no se encontró dateTime en trading-time-label')
  }
  const observedAt = dateTimeMatch[1].slice(0, 10)

  return { observedAt, value }
}

export async function runFetchRefinedPrice() {
  const point = await fetchInvestingRefinedPrice()

  const admin = getAdminClient()
  const { error } = await admin
    .from('price_items')
    .upsert(
      [
        {
          label: LABEL,
          value: point.value.toFixed(2),
          value_numeric: point.value,
          unit: UNIT,
          observed_at: point.observedAt,
          source_name: SOURCE_NAME,
          source_url: SOURCE_URL,
          status: 'published',
          featured: true,
          notes: NOTES,
        },
      ],
      { onConflict: 'label,observed_at' },
    )
  if (error) throw new Error(`Upsert en price_items falló: ${error.message}`)

  // Acota la serie a ~5 años; la UI grafica todo el histórico del label.
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS)
  const { error: cleanupError } = await admin
    .from('price_items')
    .delete()
    .eq('label', LABEL)
    .lt('observed_at', cutoff.toISOString().slice(0, 10))
  if (cleanupError) {
    console.error('[daily-market-update] limpieza de retención (refinada) falló:', cleanupError.message)
  }

  return { ok: true, observed_at: point.observedAt, value: point.value }
}
