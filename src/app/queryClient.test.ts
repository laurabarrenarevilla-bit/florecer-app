import { onlineManager } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '@/shared/lib/errors.ts'
import { createQueryClient, isPermanentError } from './queryClient.ts'

describe('reintentos de consultas', () => {
  it('los errores permanentes no se reintentan', () => {
    expect(isPermanentError(new AppError('DB_NOT_READY'))).toBe(true)
    expect(isPermanentError(new AppError('AUTH_REQUIRED'))).toBe(true)
    expect(isPermanentError(new AppError('NETWORK_UNAVAILABLE'))).toBe(false)
  })

  it('una tabla inexistente produce una sola petición', async () => {
    const queryFn = vi.fn(() => Promise.reject(new AppError('DB_NOT_READY')))
    await createQueryClient().fetchQuery({ queryKey: ['x'], queryFn }).catch(() => undefined)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('un fallo de red no se reintenta aquí (ya lo hace postgrest-js)', async () => {
    const queryFn = vi.fn(() => Promise.reject(new AppError('NETWORK_UNAVAILABLE')))
    await createQueryClient().fetchQuery({ queryKey: ['y'], queryFn }).catch(() => undefined)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('un servicio caído se reintenta una vez', async () => {
    const queryFn = vi.fn(() => Promise.reject(new AppError('DB_UNAVAILABLE')))
    const client = createQueryClient()
    client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retryDelay: 0 } })
    await client.fetchQuery({ queryKey: ['w'], queryFn }).catch(() => undefined)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  describe('sin conexión (F1-13)', () => {
    afterEach(() => onlineManager.setOnline(true))

    it('una escritura sin red falla con aviso en lugar de quedarse en pausa', async () => {
      onlineManager.setOnline(false)
      const client = createQueryClient()
      const mutationFn = vi.fn(() => Promise.reject(new AppError('NETWORK_UNAVAILABLE')))
      const result = await client
        .getMutationCache()
        .build(client, { mutationFn })
        .execute(undefined)
        .catch((error: unknown) => error)
      expect(mutationFn).toHaveBeenCalledTimes(1)
      expect(result).toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
    })

    it('una lectura sin red falla en lugar de quedarse en pausa', async () => {
      onlineManager.setOnline(false)
      const queryFn = vi.fn(() => Promise.reject(new AppError('NETWORK_UNAVAILABLE')))
      const client = createQueryClient()
      client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } })
      await expect(client.fetchQuery({ queryKey: ['z'], queryFn })).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
    })
  })
})

