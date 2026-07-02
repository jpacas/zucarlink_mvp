import { useEffect, useRef, useState } from 'react'

interface UseAsyncDataResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true

    setIsLoading(true)

    loaderRef
      .current()
      .then((result) => {
        if (active) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return {
    data,
    isLoading,
    error,
    reload: () => setVersion((v) => v + 1),
  }
}
