import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { BROWSER_UA } from '../../_shared/browser-ua.ts'

// El No.11 cotiza en ICE Futures US en centavos de USD por libra (¢/lb).
const LABEL = 'Azúcar crudo NY No.11'
const UNIT = '¢ USD/lb'
const NOTES = 'Cierre diario automático (dato retrasado, no feed en tiempo real).'
// ~5 años de historial para el gráfico de precio clave.
const RETENTION_DAYS = 1900

interface ClosePoint {
  observedAt: string // YYYY-MM-DD en zona America/New_York
  close: number
  sourceName: string
  sourceUrl: string
}

const NY_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })

function toNyDate(unixSeconds: number): string {
  return NY_DATE.format(new Date(unixSeconds * 1000))
}

async function fetchYahoo(range: string): Promise<ClosePoint[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/SB=F?interval=1d&range=${range}`
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) throw new Error(`Yahoo respondió ${res.status}`)
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  const timestamps: number[] = result?.timestamp ?? []
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? []
  const points: ClosePoint[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (typeof close !== 'number' || !Number.isFinite(close)) continue
    points.push({
      observedAt: toNyDate(timestamps[i]),
      close,
      sourceName: 'ICE (vía Yahoo Finance)',
      sourceUrl: 'https://finance.yahoo.com/quote/SB=F/',
    })
  }
  if (points.length === 0) throw new Error('Yahoo no devolvió cierres válidos')
  return points
}

async function fetchCnbc(): Promise<ClosePoint[]> {
  const url =
    'https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=@SB.1&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json'
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) throw new Error(`CNBC respondió ${res.status}`)
  const json = await res.json()
  const quote = json?.FormattedQuoteResult?.FormattedQuote?.[0]
  const settle = Number.parseFloat(quote?.settlePrice ?? '')
  const settleDate: string | undefined = quote?.settleDate
  if (!Number.isFinite(settle) || !settleDate) {
    throw new Error('CNBC no devolvió settlePrice/settleDate')
  }
  return [
    {
      observedAt: settleDate,
      close: settle,
      sourceName: 'ICE (vía CNBC)',
      sourceUrl: 'https://www.cnbc.com/quotes/@SB.1',
    },
  ]
}

export async function runFetchPrices(options: { backfill?: boolean } = {}) {
  const range = options.backfill ? '5y' : '5d'

  let points: ClosePoint[]
  let fallbackUsed = false
  try {
    points = await fetchYahoo(range)
  } catch (yahooError) {
    console.error('[daily-market-update] Yahoo falló, usando CNBC:', yahooError)
    fallbackUsed = true
    points = await fetchCnbc()
  }

  // Sin backfill solo interesa el cierre más reciente.
  const toUpsert = options.backfill ? points : points.slice(-1)

  const admin = getAdminClient()
  const rows = toUpsert.map((point) => ({
    label: LABEL,
    value: point.close.toFixed(2),
    value_numeric: point.close,
    unit: UNIT,
    observed_at: point.observedAt,
    source_name: point.sourceName,
    source_url: point.sourceUrl,
    status: 'published',
    featured: true,
    notes: NOTES,
  }))

  const { error } = await admin
    .from('price_items')
    .upsert(rows, { onConflict: 'label,observed_at' })
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
    console.error('[daily-market-update] limpieza de retención falló:', cleanupError.message)
  }

  const latest = toUpsert[toUpsert.length - 1]
  return {
    ok: true,
    rows: toUpsert.length,
    observed_at: latest.observedAt,
    value: latest.close,
    fallback_used: fallbackUsed,
  }
}
