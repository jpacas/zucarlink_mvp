import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const SITE_URL = 'https://www.zucarlink.com'

interface PageMetadataOptions {
  description?: string
  title: string
  noindex?: boolean
}

function ensureHeadTag(selector: string, create: () => HTMLElement) {
  let tag = document.head.querySelector<HTMLElement>(selector)

  if (!tag) {
    tag = create()
    document.head.appendChild(tag)
  }

  return tag
}

function ensureNamedMeta(name: string) {
  return ensureHeadTag(`meta[name="${name}"]`, () => {
    const tag = document.createElement('meta')
    tag.setAttribute('name', name)
    return tag
  })
}

function ensurePropertyMeta(property: string) {
  return ensureHeadTag(`meta[property="${property}"]`, () => {
    const tag = document.createElement('meta')
    tag.setAttribute('property', property)
    return tag
  })
}

function ensureCanonicalLink() {
  return ensureHeadTag('link[rel="canonical"]', () => {
    const tag = document.createElement('link')
    tag.setAttribute('rel', 'canonical')
    return tag
  })
}

export function usePageMetadata({ description, title, noindex }: PageMetadataOptions) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = `${title} | Zucarlink`
    const canonicalUrl = `${SITE_URL}${pathname}`
    const previousTitle = document.title

    const tags: Array<[HTMLElement, string, string | null]> = []

    const setAttr = (tag: HTMLElement, attr: string, value: string) => {
      tags.push([tag, attr, tag.getAttribute(attr)])
      tag.setAttribute(attr, value)
    }

    document.title = fullTitle
    setAttr(ensureCanonicalLink(), 'href', canonicalUrl)
    setAttr(ensurePropertyMeta('og:title'), 'content', fullTitle)
    setAttr(ensurePropertyMeta('og:url'), 'content', canonicalUrl)
    setAttr(ensureNamedMeta('twitter:title'), 'content', fullTitle)

    if (description) {
      setAttr(ensureNamedMeta('description'), 'content', description)
      setAttr(ensurePropertyMeta('og:description'), 'content', description)
      setAttr(ensureNamedMeta('twitter:description'), 'content', description)
    }

    let robotsTag: HTMLElement | null = null

    if (noindex) {
      robotsTag = ensureNamedMeta('robots')
      setAttr(robotsTag, 'content', 'noindex')
    }

    return () => {
      document.title = previousTitle

      for (const [tag, attr, previous] of tags) {
        if (previous === null) {
          tag.removeAttribute(attr)
        } else {
          tag.setAttribute(attr, previous)
        }
      }

      robotsTag?.remove()
    }
  }, [description, title, noindex, pathname])
}
