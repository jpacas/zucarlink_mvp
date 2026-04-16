import type { ContentCategory } from '../types'

interface ContentFiltersProps {
  categories: ContentCategory[]
  onCategoryChange: (value: string) => void
  onQueryChange: (value: string) => void
  query: string
  selectedCategory: string
}

export function ContentFilters({
  categories,
  onCategoryChange,
  onQueryChange,
  query,
  selectedCategory,
}: ContentFiltersProps) {
  return (
    <div className="content-filters">
      <label className="field">
        <span>Buscar contenido</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Ej. automatización, etanol, molienda"
        />
      </label>
      <label className="field">
        <span>Categoría</span>
        <select
          aria-label="Categoría"
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
