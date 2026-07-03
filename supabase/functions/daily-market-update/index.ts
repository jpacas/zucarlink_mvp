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

  // En secuencia: el resumen debe escribirse sobre la fila del día que el job
  // de precios acaba de insertar. Si un job falla, el otro corre igual.
  const prices = await runFetchPrices({ backfill: body?.backfill === true }).catch((error) => {
    console.error('[daily-market-update] fetch prices job failed:', error)
    return { ok: false, error: String(error) }
  })

  const summary = await runMarketSummary().catch((error) => {
    console.error('[daily-market-update] market summary job failed:', error)
    return { ok: false, error: String(error) }
  })

  const { error: logError } = await getAdminClient()
    .from('market_update_runs')
    .insert({ prices, summary })
  if (logError) {
    console.error('[daily-market-update] log insert failed:', logError.message)
  }

  return Response.json({ prices, summary })
})
