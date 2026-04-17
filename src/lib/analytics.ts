export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zucarlink:analytics', {
        detail: {
          name,
          payload: payload ?? {},
        },
      }),
    )
  }
}
