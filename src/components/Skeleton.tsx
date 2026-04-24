interface SkeletonProps {
  variant?: 'text' | 'heading' | 'avatar' | 'avatar-sm' | 'chip' | 'card'
  width?: string | number
  className?: string
}

export function Skeleton({ variant = 'text', width, className = '' }: SkeletonProps) {
  const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined
  return <span className={`skeleton skeleton--${variant} ${className}`} style={style} aria-hidden="true" />
}

export function SkeletonCard() {
  return (
    <article className="directory-card directory-card--public" aria-hidden="true">
      <div className="directory-card__header">
        <Skeleton variant="avatar" />
        <div className="stack stack--compact" style={{ flex: 1 }}>
          <Skeleton variant="heading" />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="chip" />
        </div>
      </div>
      <div className="chip-grid">
        <Skeleton variant="chip" />
        <Skeleton variant="chip" />
      </div>
    </article>
  )
}

export function SkeletonThreadItem() {
  return (
    <div className="messages-thread-item" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <Skeleton variant="avatar-sm" />
      <div className="messages-thread-item__body">
        <div className="messages-thread-item__header">
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="40px" />
        </div>
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  )
}
