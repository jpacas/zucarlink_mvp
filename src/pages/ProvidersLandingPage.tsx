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
    <div className="section-grid">
      <section className="hero-card">
        <p className="eyebrow">Semana 9</p>
        <h2>Convierte tu marca en un proveedor visible para la industria azucarera</h2>
        <p>
          Zucarlink le da presencia continua a proveedores que necesitan visibilidad frente a
          técnicos, ingenios y tomadores de decisión del sector.
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

      <section className="content-card stack">
        <p className="eyebrow">Beneficios</p>
        <h2>Presencia comercial ligera, enfocada en generar conversación</h2>
        <ul className="list">
          <li>Perfil comercial público con foco en productos, servicios y cobertura regional.</li>
          <li>Contacto interno sin exponer teléfonos ni depender de WhatsApp público.</li>
          <li>Visibilidad permanente frente a una audiencia técnica especializada.</li>
        </ul>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Comparación</p>
        <h2>Más contexto que una visita aislada, más continuidad que un congreso</h2>
        <p>
          La propuesta no compite por volumen sino por calidad: una ficha clara, una audiencia
          curada y un lead interno mejor estructurado.
        </p>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Prueba social</p>
        <h2>Señales de actividad comercial real</h2>
        <div className="actions">
          <span className="user-badge">{providers.length} proveedores demo visibles</span>
          <span className="user-badge">
            {new Set(providers.flatMap((provider) => provider.countries)).size} países
          </span>
          <span className="user-badge">
            {providers.filter((provider) => provider.isVerified).length} perfiles verificados
          </span>
        </div>
      </section>
    </div>
  )
}
