import { Link } from 'react-router-dom'

export function CompletenessNudge({ percent }: { percent: number }) {
  return (
    <section className="content-card dashboard-nudge">
      <div className="dashboard-nudge__body">
        <p className="dashboard-nudge__text">
          <strong>Tu perfil está {percent}% completo.</strong>{' '}
          <span className="helper-text">
            Complétalo para aparecer en el directorio y participar en el foro.
          </span>
        </p>
        <div
          className="profile-completeness__bar-wrap"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="profile-completeness__bar" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <Link className="button button--sm" to="/app/profile/edit">
        Completar perfil
      </Link>
    </section>
  )
}
