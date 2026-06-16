import { Link } from 'react-router-dom'

import { SkeletonThreadItem } from '../../components/Skeleton'
import type { MessageThread } from '../messages/types'
import { DashboardAvatar } from './DashboardAvatar'

export function RecentMessagesWidget({
  threads,
  isLoading,
}: {
  threads: MessageThread[]
  isLoading: boolean
}) {
  const unread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0)
  const recent = threads.slice(0, 3)

  return (
    <article className="content-card stack dashboard-widget">
      <div className="dashboard-widget__head">
        <p className="eyebrow">Mensajes</p>
        {unread > 0 ? (
          <span className="dashboard-widget__count" aria-label={`${unread} sin leer`}>
            {unread}
          </span>
        ) : null}
      </div>
      <h3>Conversaciones</h3>

      {isLoading ? (
        <div className="dashboard-list">
          <SkeletonThreadItem />
          <SkeletonThreadItem />
        </div>
      ) : recent.length === 0 ? (
        <p className="dashboard-empty">
          Aún no tienes conversaciones. Conecta con alguien desde el directorio.
        </p>
      ) : (
        <ul className="dashboard-list">
          {recent.map((thread) => (
            <li key={thread.threadId} className="dashboard-list__item">
              <DashboardAvatar url={thread.otherAvatarPath} name={thread.otherFullName} />
              <div className="dashboard-list__item-body">
                <span className="dashboard-list__title">{thread.otherFullName}</span>
                <span className="dashboard-list__meta">{thread.lastMessageBody}</span>
              </div>
              {thread.unreadCount > 0 ? (
                <span className="dashboard-widget__count">{thread.unreadCount}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-widget__footer">
        <Link className="inline-link" to="/app/messages">
          Ver todos los mensajes →
        </Link>
      </div>
    </article>
  )
}
