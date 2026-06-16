import { Link } from 'react-router-dom'

import { Skeleton } from '../../components/Skeleton'
import type { ForumThreadCard } from '../forum/types'
import type { PublicProfileForumActivity } from '../profile/types'

function plural(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function ForumActivityWidget({
  threads,
  activity,
  isLoading,
}: {
  threads: ForumThreadCard[]
  activity: PublicProfileForumActivity | null
  isLoading: boolean
}) {
  const recent = threads.slice(0, 3)

  return (
    <article className="content-card stack dashboard-widget">
      <p className="eyebrow">Foro</p>
      <h3>Debates recientes</h3>

      {activity ? (
        <p className="helper-text">
          Tu actividad: {plural(activity.threadCount, 'tema', 'temas')} ·{' '}
          {plural(activity.replyCount, 'respuesta', 'respuestas')}
        </p>
      ) : null}

      {isLoading ? (
        <div className="dashboard-list">
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
        </div>
      ) : recent.length === 0 ? (
        <p className="dashboard-empty">Todavía no hay debates publicados.</p>
      ) : (
        <ul className="dashboard-list">
          {recent.map((thread) => (
            <li key={thread.id} className="dashboard-list__item">
              <div className="dashboard-list__item-body">
                <Link
                  className="dashboard-list__title dashboard-list__title--link"
                  to={`/forum/thread/${thread.slug}`}
                >
                  {thread.title}
                </Link>
                <span className="dashboard-list__meta">
                  {thread.category.name} · {plural(thread.replyCount, 'respuesta', 'respuestas')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-widget__footer">
        <Link className="inline-link" to="/forum">
          Ir al foro →
        </Link>
      </div>
    </article>
  )
}
