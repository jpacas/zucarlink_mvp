import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { searchProviders } from '../features/providers/api'
import type { ProviderCard } from '../features/providers/types'
import { trackEvent } from '../lib/analytics'

export function ProvidersLandingPage() {
  const [providers, setProviders] = useState<ProviderCard[]>([])

  useEffect(() => {
    void searchProviders().then(setProviders).catch(() => setProviders([]))
  }, [])

  return (
    <div className="stack">
      <section className="hero-card stack">
        <p className="eyebrow">Proveedores</p>
        <h2>Proveedores con presencia útil dentro del sector azucarero</h2>
        <p>
          Zucarlink permite que las marcas correctas se presenten con claridad, sostengan contacto
          interno y mantengan visibilidad frente a una audiencia técnica especializada.
        </p>
        <div className="actions">
          <Link
            className="button"
            to="/register"
            onClick={() => trackEvent('providers_landing_cta_clicked', { destination: 'register' })}
          >
            Solicitar activación comercial
          </Link>
          <Link className="button button--secondary" to="/proveedores/directorio">
            Ver directorio de proveedores
          </Link>
        </div>
      </section>

      <section className="section-grid">
        <article className="content-card stack">
          <p className="eyebrow">Presencia</p>
          <h3>Una ficha clara y permanente</h3>
          <p>
            Expón cobertura, soluciones y una propuesta comercial entendible sin depender de ferias
            o contactos improvisados.
          </p>
        </article>

        <article className="content-card stack">
          <p className="eyebrow">Contacto</p>
          <h3>Primer contacto dentro de la plataforma</h3>
          <p>
            Las solicitudes entran por un canal interno y ordenado, sin exponer teléfonos o
            WhatsApp públicamente.
          </p>
        </article>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Cobertura visible</p>
        <h2>Señales actuales del directorio</h2>
        <div className="actions">
          <span className="user-badge">{providers.length} perfiles activos</span>
          <span className="user-badge">
            {new Set(providers.flatMap((provider) => provider.countries)).size} países
          </span>
          <span className="user-badge">
            {providers.filter((provider) => provider.isVerified).length} verificados
          </span>
        </div>
      </section>
    </div>
  )
}
