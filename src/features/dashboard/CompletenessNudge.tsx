import { Link } from 'react-router-dom'

import type { ProfileCompletenessResult } from '../profile/profile-status'

export function CompletenessNudge({
  percent,
  missingFields,
}: {
  percent: number
  missingFields: ProfileCompletenessResult['missingFields']
}) {
  return (
    <section className="content-card dashboard-nudge">
      <div className="dashboard-nudge__body">
        <p className="dashboard-nudge__text">
          <strong>Tu perfil está {percent}% completo.</strong>{' '}
          <span className="helper-text">
            Complétalo para aparecer en el directorio y participar en el foro.
          </span>
        </p>
        {missingFields.length > 0 ? (
          <div className="completeness-missing">
            <p className="helper-text">Para llegar al 100%, completa:</p>
            <ul className="completeness-missing__list">
              {missingFields.map((field) => (
                <li key={field.editPath} className="completeness-missing__item">
                  {field.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
