import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatRelative } from '../../lib/date'
import { getMyNotifications, markNotificationRead } from './feedApi'
import type { NotificationItem } from './feedTypes'
import { useUnreadNotificationsCount } from './useUnreadNotificationsCount'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

function describeNotification(item: NotificationItem): string {
  const actor = item.actorName || 'Alguien'
  const topic = item.topicTitle || 'tu tema'

  if (item.type === 'topic_liked') {
    return `${actor} le dio like a "${topic}"`
  }

  return `${actor} respondió a "${topic}"`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<LoadState>('idle')
  const [items, setItems] = useState<NotificationItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const unreadCount = useUnreadNotificationsCount(true)

  function loadFeed() {
    setState('loading')
    getMyNotifications(20)
      .then((data) => {
        setItems(data)
        setState('ready')
      })
      .catch(() => setState('error'))
  }

  useEffect(() => {
    if (!open) {
      return
    }

    loadFeed()

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleItemClick(item: NotificationItem) {
    setOpen(false)

    if (!item.readAt) {
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row)),
      )
      void markNotificationRead(item.id).catch(() => {})
    }

    if (item.topicSlug) {
      navigate(`/forum/thread/${item.topicSlug}`)
    }
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="notification-bell__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2a5 5 0 0 0-5 5v2.2c0 .5-.15 1-.44 1.4L3.3 12.7c-.6.8 0 2 1 2h11.4c1 0 1.6-1.2 1-2l-1.26-2.1a2.3 2.3 0 0 1-.44-1.4V7a5 5 0 0 0-5-5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 ? (
          <span className="nav-unread-badge notification-bell__badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-bell__panel" role="menu" aria-label="Notificaciones">
          {state === 'loading' ? (
            <div className="notification-bell__skeleton">
              <span className="skeleton skeleton--text" />
              <span className="skeleton skeleton--text" />
              <span className="skeleton skeleton--text" />
            </div>
          ) : null}

          {state === 'error' ? (
            <div className="notification-bell__empty">
              <p>No fue posible cargar tus notificaciones.</p>
              <button type="button" className="inline-link" onClick={loadFeed}>
                Reintentar
              </button>
            </div>
          ) : null}

          {state === 'ready' && items.length === 0 ? (
            <div className="notification-bell__empty">
              <p>No tenés novedades. Las respuestas y mensajes van a aparecer acá.</p>
            </div>
          ) : null}

          {state === 'ready' && items.length > 0 ? (
            <ul className="notification-bell__list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`notification-bell__item${item.readAt ? '' : ' notification-bell__item--unread'}`}
                    onClick={() => void handleItemClick(item)}
                  >
                    <span>{describeNotification(item)}</span>
                    <small>{formatRelative(item.createdAt)}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
