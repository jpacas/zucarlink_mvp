import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('resuelve con datos: isLoading pasa a false, data tiene el valor, error es null', async () => {
    const loader = vi.fn().mockResolvedValue({ id: 1, nombre: 'Ingenio La Cabaña' })
    const { result } = renderHook(() => useAsyncData(loader))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ id: 1, nombre: 'Ingenio La Cabaña' })
    expect(result.current.error).toBeNull()
  })

  it('rechaza con un Error: isLoading false, data null, error con el mensaje', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('fallo de red'))
    const { result } = renderHook(() => useAsyncData(loader))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('fallo de red')
  })

  it('rechaza con algo que no es Error: error usa el mensaje genérico', async () => {
    const loader = vi.fn().mockRejectedValue('string de error')
    const { result } = renderHook(() => useAsyncData(loader))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Ocurrió un error inesperado.')
  })

  it('no llama a setState tras desmontar antes de que el loader resuelva', async () => {
    let resolveLoader: (value: string) => void = () => {}
    const loader = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveLoader = resolve
        }),
    )

    const { unmount } = renderHook(() => useAsyncData(loader))

    unmount()

    await act(async () => {
      resolveLoader('valor tardío')
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('reload vuelve a invocar el loader', async () => {
    const loader = vi.fn().mockResolvedValue('ok')
    const { result } = renderHook(() => useAsyncData(loader))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(loader).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.reload()
    })

    await waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(2)
    })
  })
})
