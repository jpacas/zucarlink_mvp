interface SectionHeaderProps {
  as?: 'h1' | 'h2' | 'h3'
  description?: string
  eyebrow?: string
  title: string
}

export function SectionHeader({
  as: HeadingTag = 'h2',
  description,
  eyebrow,
  title,
}: SectionHeaderProps) {
  return (
    <div className="section-heading stack stack--compact">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <HeadingTag>{title}</HeadingTag>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
