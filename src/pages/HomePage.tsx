import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="section-grid">
      <section className="hero-card">
        <p className="eyebrow">Semana 6</p>
        <h2>Directorio privado listo para descubrimiento profesional</h2>
        <p>
          Zucarlink ya separa presencia pública agregada y exploración privada de perfiles
          técnicos, manteniendo privacidad por defecto y una base lista para activar red.
        </p>
        <div className="actions">
          <Link className="button" to="/directory">
            Ver directorio público
          </Link>
          <Link className="button button--secondary" to="/app/directory">
            Abrir directorio privado
          </Link>
        </div>
      </section>

      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Rutas públicas</p>
            <h2>Exploración inicial</h2>
          </div>
          <span className="route-chip">sin sesión</span>
        </div>
        <ul className="list">
          <li>`/` inicio</li>
          <li>`/login` acceso</li>
          <li>`/register` registro</li>
          <li>`/directory` resumen agregado del directorio</li>
          <li>`/forum` foro</li>
          <li>`/providers` proveedores</li>
        </ul>
      </section>

      <section className="content-card stack">
        <div className="split-header">
          <div className="stack">
            <p className="eyebrow">Rutas privadas</p>
            <h2>Área autenticada</h2>
          </div>
          <span className="route-chip">requiere sesión</span>
        </div>
        <ul className="list">
          <li>`/app` panel</li>
          <li>`/app/directory` directorio privado</li>
          <li>`/app/profile` perfil</li>
          <li>`/app/messages` mensajes</li>
          <li>`/app/settings` ajustes</li>
        </ul>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Estado</p>
        <h2>Semana 6 en ejecución</h2>
        <p>
          El directorio ya muestra masa crítica en público y perfiles útiles en privado.
          La siguiente etapa puede enfocarse en foro y activación sin rehacer la base.
        </p>
      </section>
    </div>
  )
}
