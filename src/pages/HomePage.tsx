import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="section-grid">
      <section className="hero-card">
        <p className="eyebrow">Fase 8</p>
        <h2>Skeletons funcionales y navegación base del MVP</h2>
        <p>
          Esta capa deja todas las pantallas mínimas del producto visibles,
          ordenadas y listas para evolucionar sin rehacer routing ni layouts.
        </p>
        <div className="actions">
          <Link className="button" to="/register">
            Crear cuenta
          </Link>
          <Link className="button button--secondary" to="/app">
            Ver área privada
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
          <li>`/directory` directorio</li>
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
          <li>`/app/profile` perfil</li>
          <li>`/app/messages` mensajes</li>
          <li>`/app/settings` ajustes</li>
        </ul>
      </section>

      <section className="content-card stack">
        <p className="eyebrow">Estado</p>
        <h2>Base lista para Semana 5</h2>
        <p>
          Las pantallas existen, la navegación distingue público y privado y los
          placeholders ya sirven como punto de entrada para implementar módulos
          reales sin rehacer estructura.
        </p>
      </section>
    </div>
  )
}
