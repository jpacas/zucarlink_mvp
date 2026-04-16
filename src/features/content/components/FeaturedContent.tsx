import type { ContentItem } from '../types'
import { ContentCard } from './ContentCard'
import { SectionHeader } from './SectionHeader'

interface FeaturedContentProps {
  items: ContentItem[]
}

export function FeaturedContent({ items }: FeaturedContentProps) {
  return (
    <section className="stack">
      <SectionHeader
        eyebrow="Curación"
        title="Destacados de la semana"
        description="Piezas seleccionadas para dar contexto rápido y abrir conversaciones útiles."
      />
      <div className="content-card-grid">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
