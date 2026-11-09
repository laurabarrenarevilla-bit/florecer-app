import { describe, expect, it } from 'vitest'
import { AppError, toAppError } from './errors.ts'

describe('toAppError', () => {
  it('mapea códigos de PostgreSQL/PostgREST', () => {
    expect(toAppError({ code: '23505', message: 'duplicate key' }).code).toBe('ENTRY_CONFLICT')
    expect(toAppError({ code: '23514', message: 'check' }).code).toBe('VALIDATION_ERROR')
    expect(toAppError({ code: '42501', message: 'permission denied' }).code).toBe('PERMISSION_DENIED')
    expect(toAppError({ code: 'PGRST303', message: 'JWT expired' }).code).toBe('AUTH_REQUIRED')
    expect(toAppError({ code: '', message: 'JWT expired' }).code).toBe('AUTH_REQUIRED')
  })

  it('detecta fallos de red', () => {
    expect(toAppError(new TypeError('Failed to fetch')).code).toBe('NETWORK_UNAVAILABLE')
    expect(toAppError({ code: '', message: 'TypeError: NetworkError when attempting to fetch resource.' }).code).toBe(
      'NETWORK_UNAVAILABLE',
    )
  })

  it('conserva AppError y usa UNKNOWN en lo demás', () => {
    const original = new AppError('ENTRY_NOT_FOUND')
    expect(toAppError(original)).toBe(original)
    expect(toAppError('algo raro').code).toBe('UNKNOWN')
  })

  it('no incluye el mensaje técnico original', () => {
    const error = toAppError({ code: 'XX000', message: 'detalle interno con datos' })
    expect(error.message).not.toContain('detalle interno')
  })
})
