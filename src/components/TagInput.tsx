import { useState } from 'react'

interface TagInputProps {
  id: string
  // Cadena separada por comas (compatible con el draft de proveedor).
  value: string
  onChange: (nextValue: string) => void
  placeholder?: string
  ariaLabel?: string
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// Input de etiquetas: escribir + Enter (o coma) agrega un chip; la × lo elimina.
// Emite y recibe una cadena separada por comas para encajar con el resto del formulario.
export function TagInput({ id, value, onChange, placeholder, ariaLabel }: TagInputProps) {
  const [text, setText] = useState('')
  const tags = parseTags(value)

  function addTag(raw: string) {
    const next = raw.trim()
    if (!next) {
      return
    }
    // Evita duplicados sin distinguir mayúsculas/acentos visibles.
    const exists = tags.some((tag) => tag.toLowerCase() === next.toLowerCase())
    if (!exists) {
      onChange([...tags, next].join(', '))
    }
    setText('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag).join(', '))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(text)
    } else if (event.key === 'Backspace' && !text && tags.length > 0) {
      // Backspace con el input vacío borra la última etiqueta.
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="tag-input">
      {tags.length > 0 ? (
        <div className="chip-grid">
          {tags.map((tag) => (
            <span key={tag} className="chip chip--active tag-input__chip">
              {tag}
              <button
                type="button"
                className="tag-input__remove"
                aria-label={`Quitar ${tag}`}
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <input
        id={id}
        type="text"
        value={text}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(text)}
      />
    </div>
  )
}
