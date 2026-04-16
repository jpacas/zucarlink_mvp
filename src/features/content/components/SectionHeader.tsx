interface SectionHeaderProps {
  description?: string
  eyebrow?: string
  title: string
}

export function SectionHeader({ description, eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="section-heading stack stack--compact">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
