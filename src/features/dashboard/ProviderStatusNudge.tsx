import { Link } from 'react-router-dom'

export function ProviderStatusNudge() {
  return (
    <section className="content-card dashboard-nudge">
      <div className="dashboard-nudge__body">
        <p className="dashboard-nudge__text">
          <strong>Tu ficha comercial está incompleta.</strong>{' '}
          <span className="helper-text">
            Complétala para aparecer en el directorio de proveedores.
          </span>
        </p>
      </div>
      <Link className="button button--sm" to="/app/provider/edit">
        Completar ficha
      </Link>
    </section>
  )
}
