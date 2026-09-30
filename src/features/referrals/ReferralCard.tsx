import { useEffect, useState } from 'react'

import { ShareMenu } from '../../components/ShareMenu'
import { SITE_URL } from '../../lib/usePageMetadata'
import { getMyReferralSummary } from './api'

export function ReferralCard() {
  const [code, setCode] = useState<string | null>(null)
  const [redemptionCount, setRedemptionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyReferralSummary()
      .then((summary) => {
        if (cancelled) return
        setCode(summary?.code ?? null)
        setRedemptionCount(summary?.redemptionCount ?? 0)
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'No fue posible generar tu enlace.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const inviteUrl = code ? `${SITE_URL}/register?ref=${code}` : `${SITE_URL}/register`

  return (
    <article className="info-card stack">
      <h3>Invitar colegas</h3>
      <p className="helper-text">
        Compartí tu enlace con otros técnicos del sector. No mostramos quién se unió, solo cuántos.
      </p>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {redemptionCount > 0 ? (
        <p className="status">
          {redemptionCount === 1
            ? 'Una persona se unió con tu invitación.'
            : `${redemptionCount} personas se unieron con tu invitación.`}
        </p>
      ) : null}

      <ShareMenu
        className="button button--secondary"
        url={inviteUrl}
        title="Invitación a Zucarlink"
        shareText={`Unite a Zucarlink, la red profesional de la industria azucarera: ${inviteUrl}`}
        copyLabel="Copiar enlace"
        copySuccessMessage="Enlace de invitación copiado"
        nativeShare
        isPreparing={isLoading || !code}
      />
    </article>
  )
}
