interface ProviderLogoProps {
  companyName: string
  logoUrl: string | null
  size?: 'sm' | 'md'
}

function getInitials(companyName: string) {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProviderLogo({ companyName, logoUrl, size = 'md' }: ProviderLogoProps) {
  const className = size === 'sm' ? 'provider-logo provider-logo--sm' : 'provider-logo'

  if (logoUrl) {
    return <img className={className} src={logoUrl} alt={`Logo de ${companyName}`} />
  }

  return (
    <div className={`${className} provider-logo--fallback`} aria-label={`Logo de ${companyName}`}>
      <span>{getInitials(companyName)}</span>
    </div>
  )
}
