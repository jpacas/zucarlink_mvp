import { runFetchPrices } from './jobs/fetch-prices.ts'
import { runMarketSummary } from './jobs/market-summary.ts'
import { getAdminClient } from '../_shared/supabase-admin.ts'

const CRON_SECRET = Deno.env.get('PRICES_CRON_SECRET') ?? ''

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  const prices = await runFetchPrices({ backfill: body?.backfill === true }).catch((error) => {
    console.error('[daily-market-update] fetch prices job failed:', error)
    return { ok: false, error: String(error) }
  })

  // El resumen de mercado es semanal (una entrada por semana en
  // price_market_summaries): solo corre los lunes, salvo que se fuerce
  // explícitamente (ej. para sembrar la primera entrada tras el deploy).
  const isSummaryDay = new Date().getUTCDay() === 1
  const summary =
    isSummaryDay || body?.forceSummary === true
      ? await runMarketSummary().catch((error) => {
          console.error('[daily-market-update] market summary job failed:', error)
          return { ok: false, error: String(error) }
        })
      : { ok: true, skipped: true, reason: 'not-summary-day' }

  const { error: logError } = await getAdminClient()
    .from('market_update_runs')
    .insert({ prices, summary })
  if (logError) {
    console.error('[daily-market-update] log insert failed:', logError.message)
  }

  return Response.json({ prices, summary })
})
