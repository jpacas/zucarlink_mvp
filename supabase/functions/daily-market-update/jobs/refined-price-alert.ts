import { getAdminClient } from '../../_shared/supabase-admin.ts'
import { sendEmail } from '../../_shared/resend.ts'

const LABEL = 'Azúcar refinada'
const ALERT_TO = 'zucarlink@gmail.com'
const MAX_STALE_DAYS = 1

function startOfTodayUtcIso(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  return Math.floor((to - from) / (1000 * 60 * 60 * 24))
}

async function alertAlreadySentToday(): Promise<boolean> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('market_update_runs')
    .select('refined')
    .gte('ran_at', startOfTodayUtcIso())
  if (error) {
    console.error('[daily-market-update] no se pudo leer market_update_runs para el throttle de alerta:', error.message)
    return false
  }
  return (data ?? []).some((row) => {
    const refined = row.refined as Record<string, unknown> | null
    return refined?.alert_sent === true
  })
}

export async function maybeAlertRefinedPriceStale(
  fetchError: Error | null,
): Promise<{ alert_sent: boolean; reason?: string }> {
  const admin = getAdminClient()
  const { data: latest, error } = await admin
    .from('price_items')
    .select('observed_at')
    .eq('label', LABEL)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[daily-market-update] no se pudo leer el último observed_at de Azúcar refinada:', error.message)
    return { alert_sent: false, reason: 'no-se-pudo-leer-precio' }
  }

  const todayIso = new Date().toISOString()
  const staleDays = latest ? daysBetween(latest.observed_at, todayIso) : Number.POSITIVE_INFINITY

  const needsAlert = fetchError !== null || staleDays > MAX_STALE_DAYS
  if (!needsAlert) {
    return { alert_sent: false, reason: 'sin-problema' }
  }

  if (await alertAlreadySentToday()) {
    return { alert_sent: false, reason: 'ya-alertado-hoy' }
  }

  const reasonText = fetchError
    ? `El scraping de Investing.com falló: ${fetchError.message}`
    : `El último precio registrado es del ${latest?.observed_at ?? 'desconocido'}, hace ${staleDays} día(s).`

  try {
    await sendEmail({
      to: ALERT_TO,
      subject: 'Zucarlink — Azúcar refinada sin actualizar',
      html: `<p>${reasonText}</p><p>Revisa <code>market_update_runs</code> en Supabase para el detalle del error.</p>`,
    })
  } catch (sendError) {
    console.error('[daily-market-update] no se pudo enviar el correo de alerta de Azúcar refinada:', (sendError as Error).message)
    return { alert_sent: false, reason: 'fallo-envio-correo' }
  }

  return { alert_sent: true }
}
