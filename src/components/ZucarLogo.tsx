interface ZucarLogoProps {
  variant?: 'light' | 'dark'
  height?: number
  layout?: 'horizontal' | 'vertical'
  className?: string
}

export function ZucarLogo({
  variant = 'light',
  height = 36,
  layout = 'horizontal',
  className,
}: ZucarLogoProps) {
  const src =
    layout === 'vertical'
      ? '/logos/logo-vertical.png'
      : '/logos/logo-horizontal.png'

  const style: React.CSSProperties = {
    height,
    width: 'auto',
    display: 'block',
    ...(variant === 'dark' ? { filter: 'brightness(0) invert(1)' } : {}),
  }

  return (
    <img
      src={src}
      alt="Zucarlink"
      height={height}
      style={style}
      className={className}
    />
  )
}
