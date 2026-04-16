import { useEffect } from 'react'

interface PageMetadataOptions {
  description?: string
  title: string
}

function ensureDescriptionTag() {
  let tag = document.querySelector('meta[name="description"]')

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }

  return tag
}

export function usePageMetadata({ description, title }: PageMetadataOptions) {
  useEffect(() => {
    const previousTitle = document.title
    const descriptionTag = ensureDescriptionTag()
    const previousDescription = descriptionTag.getAttribute('content') ?? ''

    document.title = `${title} | Zucarlink`

    if (description) {
      descriptionTag.setAttribute('content', description)
    }

    return () => {
      document.title = previousTitle
      descriptionTag.setAttribute('content', previousDescription)
    }
  }, [description, title])
}
