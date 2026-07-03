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

  // Aspect ratio real de los PNG en public/logos/ (800px de ancho base):
  // horizontal 800x214, vertical 800x477.
  const aspectRatio = layout === 'vertical' ? 800 / 477 : 800 / 214
  const width = Math.round(height * aspectRatio)

  return (
    <img
      src={src}
      alt="Zucarlink"
      width={width}
      height={height}
      style={style}
      className={className}
    />
  )
}
