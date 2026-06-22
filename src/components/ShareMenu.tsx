import { useEffect, useRef, useState } from 'react'

import {
  FacebookIcon,
  LinkIcon,
  LinkedInIcon,
  ShareIcon,
  WhatsAppIcon,
} from './ForumIcons'

interface ShareMenuProps {
  url: string
  title: string
  className?: string
}

export function ShareMenu({ url, title, className }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const shareText = `${title} ${url}`
  const networks = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      icon: <WhatsAppIcon />,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <LinkedInIcon />,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <FacebookIcon />,
    },
  ]

  function openNetwork(href: string) {
    window.open(href, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('Enlace copiado')
    } catch {
      setFeedback('No fue posible copiar el enlace')
    }
    window.setTimeout(() => {
      setFeedback(null)
      setOpen(false)
    }, 1400)
  }

  return (
    <div className="share-menu" ref={containerRef}>
      <button
        type="button"
        className={className ?? 'forum-action forum-action--sm'}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Compartir"
      >
        <ShareIcon />
        <span>Compartir</span>
      </button>

      {open ? (
        <div className="share-menu__panel" role="menu" aria-label="Opciones para compartir">
          {networks.map((network) => (
            <button
              key={network.key}
              type="button"
              role="menuitem"
              className="share-menu__item"
              onClick={() => openNetwork(network.href)}
            >
              {network.icon}
              <span>{network.label}</span>
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="share-menu__item"
            onClick={handleCopyLink}
          >
            <LinkIcon />
            <span>{feedback ?? 'Copiar enlace'}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
