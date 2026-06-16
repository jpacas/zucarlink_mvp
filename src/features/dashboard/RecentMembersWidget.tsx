import { Link } from 'react-router-dom'

import { Skeleton } from '../../components/Skeleton'
import type { PublicPreviewProfile } from '../directory/api'
import { DashboardAvatar } from './DashboardAvatar'

export function RecentMembersWidget({
  members,
  isLoading,
}: {
  members: PublicPreviewProfile[]
  isLoading: boolean
}) {
  const recent = members.slice(0, 3)

  return (
    <article className="content-card stack dashboard-widget">
      <p className="eyebrow">Directorio</p>
      <h3>Miembros recientes</h3>

      {isLoading ? (
        <div className="dashboard-list">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      ) : recent.length === 0 ? (
        <p className="dashboard-empty">Aún no hay perfiles que mostrar.</p>
      ) : (
        <ul className="dashboard-list">
          {recent.map((member) => (
            <li key={member.id} className="dashboard-list__item">
              <DashboardAvatar url={member.avatarUrl} name={member.fullName} />
              <div className="dashboard-list__item-body">
                <Link
                  className="dashboard-list__title dashboard-list__title--link"
                  to={`/app/directory/${member.id}`}
                >
                  {member.fullName}
                </Link>
                <span className="dashboard-list__meta">
                  {[member.roleTitle, member.organizationName].filter(Boolean).join(' · ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-widget__footer">
        <Link className="inline-link" to="/app/directory">
          Explorar directorio →
        </Link>
      </div>
    </article>
  )
}
