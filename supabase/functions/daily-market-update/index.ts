import { runFetchPrices } from './jobs/fetch-prices.ts'
import { runFetchRefinedPrice } from './jobs/fetch-refined-price.ts'
import { maybeAlertRefinedPriceStale } from './jobs/refined-price-alert.ts'
import { runMarketSummary } from './jobs/market-summary.ts'
import { getAdminClient } from '../_shared/supabase-admin.ts'
import { verifyBearerSecret } from '../_shared/verify-secret.ts'

const CRON_SECRET = Deno.env.get('PRICES_CRON_SECRET') ?? ''

Deno.serve(async (req: Request) => {
  if (!(await verifyBearerSecret(req, CRON_SECRET))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  const prices = await runFetchPrices({ backfill: body?.backfill === true }).catch((error) => {
    console.error('[daily-market-update] fetch prices job failed:', error)
    return { ok: false, error: String(error) }
  })

  let refinedError: Error | null = null
  const refinedResult = await runFetchRefinedPrice().catch((error) => {
    console.error('[daily-market-update] fetch refined price job failed:', error)
    refinedError = error instanceof Error ? error : new Error(String(error))
    return { ok: false, error: String(error) }
  })
  const alertResult = await maybeAlertRefinedPriceStale(refinedError)
  const refined = { ...refinedResult, alert_sent: alertResult.alert_sent }

  // El resumen de mercado es semanal y una llamada a Anthropic con
  // web_search por label — correr varios labels en un mismo request se
  // acerca al límite de idle timeout (150s) de la Edge Function. Por eso
  // esta invocación solo genera resumen cuando viene un label explícito
  // (los crons semanales, uno por serie, lo pasan) o con forceSummary para
  // pruebas manuales; el cron diario de precios nunca dispara resúmenes.
  const summaryLabel = typeof body?.label === 'string' ? body.label : undefined
  const shouldRunSummary = body?.forceSummary === true || Boolean(summaryLabel)
  const summary = shouldRunSummary
    ? await runMarketSummary({ label: summaryLabel }).catch((error) => {
        console.error('[daily-market-update] market summary job failed:', error)
        return { ok: false, error: String(error) }
      })
    : { ok: true, skipped: true, reason: 'no-label-or-force' }

  const { error: logError } = await getAdminClient()
    .from('market_update_runs')
    .insert({ prices, refined, summary })
  if (logError) {
    console.error('[daily-market-update] log insert failed:', logError.message)
  }

  return Response.json({ prices, refined, summary })
})
