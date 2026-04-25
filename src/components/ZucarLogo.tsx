interface ZucarLogoProps {
  variant?: 'light' | 'dark'
  size?: number
  wordmark?: boolean
  className?: string
}

export function ZucarLogo({ variant = 'light', size = 28, wordmark = true, className }: ZucarLogoProps) {
  const textColor = variant === 'dark' ? '#ffffff' : '#201747'
  const centerColor = variant === 'dark' ? '#ffffff' : '#201747'

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.32), lineHeight: 1 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Center circle */}
        <circle cx="20" cy="20" r="5.8" fill={centerColor} />
        {/* Petal: top — cyan */}
        <ellipse cx="20" cy="9" rx="4.6" ry="2.9" fill="#00C9FF" />
        {/* Petal: top-right — orange */}
        <ellipse cx="20" cy="9" rx="4.6" ry="2.9" fill="#FF724B" transform="rotate(60 20 20)" />
        {/* Petal: bottom-right — green */}
        <ellipse cx="20" cy="9" rx="4.6" ry="2.9" fill="#0DDB89" transform="rotate(120 20 20)" />
        {/* Petal: bottom — cyan */}
        <ellipse cx="20" cy="9" rx="4.6" ry="2.9" fill="#00C9FF" transform="rotate(180 20 20)" />
        {/* Petal: bottom-left — orange */}
        <ellipse cx="20" cy="9" rx="4.6" ry="2.9" fill="#FF724B" transform="rotate(240 20 20)" />
        {/* Petal: top-left — green */}
        <ellipse cx="20" cy="9" rx="4.6" ry="2.9" fill="#0DDB89" transform="rotate(300 20 20)" />
      </svg>
      {wordmark && (
        <span
          style={{
            fontFamily: '"Neurial Grotesk", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: Math.round(size * 0.6),
            color: textColor,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Zucarlink
        </span>
      )}
    </span>
  )
}
