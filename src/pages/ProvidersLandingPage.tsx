import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { searchProviders } from '../features/providers/api'
import type { ProviderCard } from '../features/providers/types'
import { trackEvent } from '../lib/analytics'
import { usePageMetadata } from '../lib/usePageMetadata'

export function ProvidersLandingPage() {
  const [providers, setProviders] = useState<ProviderCard[]>([])
  usePageMetadata({
    title: 'Proveedores del sector azucarero',
    description:
      'Empresas y marcas con presencia útil ante una audiencia técnica especializada de la industria azucarera.',
  })

  useEffect(() => {
    // Solo se usa para las cifras agregadas de la sección "Cobertura visible";
    // se pide el máximo permitido por la RPC (200) en vez de la página estándar.
    void searchProviders(undefined, { limit: 200 })
      .then(setProviders)
      .catch(() => setProviders([]))
  }, [])

  return (
    <div className="stack">
      <section className="hero-card hero-card--proveedor stack">
        <p className="eyebrow">Proveedores</p>
        <h2>Proveedores con presencia útil dentro del sector azucarero</h2>
        <p>
          Zucarlink permite que las marcas correctas se presenten con claridad, sostengan contacto
          interno y mantengan visibilidad frente a una audiencia técnica especializada.
        </p>
        <div className="actions">
          <Link
            className="button button--proveedor"
            to="/register"
            onClick={() => trackEvent('providers_landing_cta_clicked', { destination: 'register' })}
          >
            Solicitar activación comercial
          </Link>
          <Link className="button button--secondary button--proveedor" to="/proveedores/directorio">
            Ver directorio de proveedores
          </Link>
        </div>
      </section>

      <section className="section-grid">
        <article className="content-card content-card--proveedor stack">
          <p className="eyebrow">Presencia</p>
          <h3>Una ficha clara y permanente</h3>
          <p>
            Expón cobertura, soluciones y una propuesta comercial entendible sin depender de ferias
            o contactos improvisados.
          </p>
        </article>

        <article className="content-card content-card--proveedor stack">
          <p className="eyebrow">Contacto</p>
          <h3>Primer contacto dentro de la plataforma</h3>
          <p>
            Las solicitudes entran por un canal interno y ordenado, sin exponer teléfonos o
            WhatsApp públicamente.
          </p>
        </article>
      </section>

      <section className="content-card content-card--info stack">
        <p className="eyebrow">Cobertura visible</p>
        <h2>Señales actuales del directorio</h2>
        {providers.length > 0 ? (
          <div className="actions">
            <span className="user-badge user-badge--proveedor">{providers.length} perfiles activos</span>
            <span className="user-badge user-badge--info">
              {new Set(providers.flatMap((provider) => provider.countries)).size} países
            </span>
          </div>
        ) : (
          <p className="helper-text">Todavía no hay proveedores activos en el directorio.</p>
        )}
      </section>
    </div>
  )
}
