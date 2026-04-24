import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { useAuth } from '../features/auth/AuthProvider'
import { SkeletonThreadItem } from '../components/Skeleton'
import {
  getThreadMessages,
  listMyThreads,
  markThreadRead,
  sendMessage,
  startOrGetThread,
} from '../features/messages/api'
import type { Message, MessageThread } from '../features/messages/types'

const POLL_INTERVAL_MS = 8_000

function formatTime(isoString: string) {
  const date = new Date(isoString)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function AvatarDisplay({
  avatarPath,
  name,
  size = 'md',
}: {
  avatarPath: string | null
  name: string
  size?: 'sm' | 'md'
}) {
  const [error, setError] = useState(false)

  if (avatarPath && !error) {
    return (
      <img
        className={`avatar-image avatar-image--${size}`}
        src={avatarPath}
        alt={name}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className={`avatar-fallback avatar-fallback--${size}`} aria-hidden="true">
      {name.slice(0, 1).toUpperCase() || 'Z'}
    </div>
  )
}

function ThreadListItem({
  thread,
  isActive,
  onClick,
}: {
  thread: MessageThread
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`messages-thread-item${isActive ? ' messages-thread-item--active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
    >
      <AvatarDisplay avatarPath={thread.otherAvatarPath} name={thread.otherFullName} size="sm" />
      <div className="messages-thread-item__body">
        <div className="messages-thread-item__header">
          <span className="messages-thread-item__name">{thread.otherFullName}</span>
          {thread.lastMessageAt ? (
            <span className="messages-thread-item__time helper-text">
              {formatTime(thread.lastMessageAt)}
            </span>
          ) : null}
        </div>
        <p className="messages-thread-item__preview helper-text">
          {thread.lastMessageBody
            ? thread.lastMessageBody.slice(0, 72) + (thread.lastMessageBody.length > 72 ? '…' : '')
            : 'Sin mensajes todavía'}
        </p>
      </div>
      {thread.unreadCount > 0 ? (
        <span className="messages-unread-badge" aria-label={`${thread.unreadCount} no leídos`}>
          {thread.unreadCount}
        </span>
      ) : null}
    </button>
  )
}

function MessageBubble({
  message,
  isMine,
}: {
  message: Message
  isMine: boolean
}) {
  return (
    <div className={`message-bubble-wrap${isMine ? ' message-bubble-wrap--mine' : ''}`}>
      <div className={`message-bubble${isMine ? ' message-bubble--mine' : ''}`}>
        <p className="message-bubble__body">{message.body}</p>
        <span className="message-bubble__time helper-text">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}

export function MessagesPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [threads, setThreads] = useState<MessageThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [threadsError, setThreadsError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [showMobileThread, setShowMobileThread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedThread = threads.find((t) => t.threadId === selectedThreadId) ?? null

  // Handle ?to=<profileId> on mount: auto-start or get thread
  useEffect(() => {
    const toProfileId = searchParams.get('to')

    if (!toProfileId) return

    void startOrGetThread(toProfileId)
      .then((threadId) => {
        setSelectedThreadId(threadId)
        setShowMobileThread(true)
      })
      .catch(() => {})
  }, [searchParams])

  // Load thread list
  const loadThreads = async () => {
    try {
      const rows = await listMyThreads()
      setThreads(rows)
      setThreadsError(null)
    } catch (error) {
      setThreadsError(error instanceof Error ? error.message : 'No fue posible cargar conversaciones.')
    } finally {
      setThreadsLoading(false)
    }
  }

  useEffect(() => {
    void loadThreads()
  }, [])

  // Load messages for selected thread + mark as read
  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      return
    }

    let isMounted = true
    setMessagesLoading(true)

    const fetchMessages = async () => {
      try {
        const rows = await getThreadMessages(selectedThreadId)

        if (isMounted) {
          setMessages(rows)
        }

        await markThreadRead(selectedThreadId)

        if (isMounted) {
          setThreads((prev) =>
            prev.map((t) =>
              t.threadId === selectedThreadId ? { ...t, unreadCount: 0 } : t,
            ),
          )
        }
      } catch {
        // non-critical
      } finally {
        if (isMounted) {
          setMessagesLoading(false)
        }
      }
    }

    void fetchMessages()

    return () => {
      isMounted = false
    }
  }, [selectedThreadId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages in active thread
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }

    if (!selectedThreadId) return

    pollRef.current = setInterval(() => {
      void getThreadMessages(selectedThreadId)
        .then((rows) => {
          setMessages(rows)
          return markThreadRead(selectedThreadId)
        })
        .then(() => {
          setThreads((prev) =>
            prev.map((t) =>
              t.threadId === selectedThreadId ? { ...t, unreadCount: 0 } : t,
            ),
          )
        })
        .catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [selectedThreadId])

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId)
    setShowMobileThread(true)
    setSendError(null)
  }

  const handleSend = async () => {
    if (!selectedThreadId || !newMessage.trim() || isSending) return

    const body = newMessage.trim()
    setNewMessage('')
    setIsSending(true)
    setSendError(null)

    try {
      await sendMessage(selectedThreadId, body)
      const rows = await getThreadMessages(selectedThreadId)
      setMessages(rows)

      // Refresh thread list to update last message preview
      void loadThreads()
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'No fue posible enviar el mensaje.')
      setNewMessage(body) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Área privada</p>
          <h2>Mensajes</h2>
          <p>Conversaciones privadas dentro de Zucarlink. Tus datos de contacto permanecen ocultos.</p>
        </div>
        <Link className="button button--secondary" to="/app/directory">
          Ir al directorio
        </Link>
      </div>

      <div className="messages-layout">
        {/* Thread list sidebar */}
        <aside
          className={`messages-sidebar${showMobileThread ? ' messages-sidebar--hidden-mobile' : ''}`}
          aria-label="Conversaciones"
        >
          <h3 className="messages-sidebar__title">Conversaciones</h3>

          {threadsLoading ? (
            <div className="messages-thread-list" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonThreadItem key={i} />)}
            </div>
          ) : threadsError ? (
            <div style={{ padding: '16px' }}>
              <p className="error-text">{threadsError}</p>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => void loadThreads()}
                style={{ marginTop: '8px' }}
              >
                Reintentar
              </button>
            </div>
          ) : threads.length === 0 ? (
            <div className="messages-empty-list">
              <p className="helper-text">Aún no tienes conversaciones.</p>
              <p className="helper-text">Inicia una desde el directorio de miembros.</p>
              <Link className="button" to="/app/directory" style={{ marginTop: '12px' }}>
                Abrir directorio
              </Link>
            </div>
          ) : (
            <div className="messages-thread-list" role="list">
              {threads.map((thread) => (
                <ThreadListItem
                  key={thread.threadId}
                  thread={thread}
                  isActive={thread.threadId === selectedThreadId}
                  onClick={() => handleSelectThread(thread.threadId)}
                />
              ))}
            </div>
          )}
        </aside>

        {/* Thread view */}
        <div
          className={`messages-thread${showMobileThread ? ' messages-thread--visible-mobile' : ''}`}
          aria-label="Conversación activa"
        >
          {!selectedThread ? (
            <div className="messages-thread-placeholder">
              <p className="helper-text">Selecciona una conversación para comenzar.</p>
              <Link className="button button--secondary" to="/app/directory">
                Buscar un colega en el directorio
              </Link>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="messages-thread-header">
                <button
                  type="button"
                  className="messages-back-btn"
                  onClick={() => setShowMobileThread(false)}
                  aria-label="Volver a la lista"
                >
                  ←
                </button>
                <AvatarDisplay
                  avatarPath={selectedThread.otherAvatarPath}
                  name={selectedThread.otherFullName}
                  size="sm"
                />
                <div className="stack stack--compact">
                  <strong>{selectedThread.otherFullName}</strong>
                  {selectedThread.otherVerificationStatus === 'verified' ? (
                    <span className="user-badge user-badge--sm">Verificado</span>
                  ) : null}
                </div>
                <Link
                  className="button button--secondary"
                  to={`/app/directory/${selectedThread.otherProfileId}`}
                  style={{ marginLeft: 'auto' }}
                >
                  Ver perfil
                </Link>
              </div>

              {/* Messages */}
              <div className="messages-body" role="log" aria-live="polite" aria-label="Mensajes">
                {messagesLoading && messages.length === 0 ? (
                  <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`message-bubble-wrap${i % 2 === 1 ? ' message-bubble-wrap--mine' : ''}`}>
                        <div className="message-bubble" style={{ width: `${48 + (i * 7) % 30}%`, height: 48, background: 'rgba(17,34,51,0.06)', borderRadius: 16 }} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="helper-text" style={{ textAlign: 'center', padding: '32px 0' }}>
                    Aún no hay mensajes. ¡Inicia la conversación!
                  </p>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={message.senderId === user?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>

              {/* Composer */}
              <div className="messages-composer">
                {sendError ? (
                  <p className="error-text" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                    {sendError}
                  </p>
                ) : null}
                <div className="messages-composer__row">
                  <textarea
                    className="messages-composer__input"
                    placeholder="Escribe tu mensaje... (Enter para enviar)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={isSending}
                    aria-label="Escribe un mensaje"
                  />
                  <button
                    type="button"
                    className="button messages-composer__send"
                    onClick={() => void handleSend()}
                    disabled={isSending || !newMessage.trim()}
                    aria-label="Enviar mensaje"
                  >
                    {isSending ? '...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
