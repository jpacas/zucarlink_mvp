import { useState } from 'react'

export function DashboardAvatar({ url, name }: { url: string | null; name: string }) {
  const [error, setError] = useState(false)

  if (url && !error) {
    return (
      <img
        className="avatar-image avatar-image--sm"
        src={url}
        alt=""
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="avatar-fallback avatar-fallback--sm" aria-hidden="true">
      {name.slice(0, 1).toUpperCase() || 'Z'}
    </div>
  )
}
