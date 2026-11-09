import { describe, expect, it } from 'vitest'
import { mapAuthError } from './authErrors.ts'
import { safeRedirectPath } from './redirect.ts'
import { loginSchema, signUpSchema } from './schema.ts'

describe('signUpSchema', () => {
  const valid = { email: 'Persona@Ejemplo.test', password: 'Florecer2026', confirmPassword: 'Florecer2026' }

  it('acepta datos válidos y normaliza el correo', () => {
    expect(signUpSchema.parse(valid).email).toBe('persona@ejemplo.test')
  })

  it.each([
    ['corta', 'Flo1', 'Usa al menos 8 caracteres.'],
    ['sin mayúscula', 'florecer2026', 'Incluye al menos una letra mayúscula.'],
    ['sin minúscula', 'FLORECER2026', 'Incluye al menos una letra minúscula.'],
    ['sin número', 'Florecerrrr', 'Incluye al menos un número.'],
  ])('rechaza contraseña %s', (_, password, message) => {
    const result = signUpSchema.safeParse({ ...valid, password, confirmPassword: password })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it('rechaza contraseñas que no coinciden', () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: 'Florecer2027' })
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword'])
  })
})

describe('loginSchema', () => {
  it('no revela la política de contraseñas en el acceso', () => {
    expect(loginSchema.safeParse({ email: 'a@b.test', password: 'x' }).success).toBe(true)
  })
})

describe('mapAuthError', () => {
  it('traduce códigos de Supabase Auth', () => {
    expect(mapAuthError({ name: 'AuthApiError', code: 'invalid_credentials', status: 400, message: '' }).code).toBe(
      'INVALID_CREDENTIALS',
    )
    expect(mapAuthError({ name: 'AuthApiError', code: 'user_already_exists', status: 422 }).code).toBe('USER_ALREADY_EXISTS')
    expect(mapAuthError({ name: 'AuthApiError', code: 'weak_password', status: 422 }).code).toBe('WEAK_PASSWORD')
    expect(mapAuthError({ name: 'AuthApiError', code: 'over_request_rate_limit', status: 429 }).code).toBe('RATE_LIMITED')
    expect(mapAuthError({ name: 'AuthApiError', code: 'signup_disabled', status: 422 }).code).toBe('SIGNUP_DISABLED')
  })

  it('detecta errores de red', () => {
    expect(mapAuthError({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }).code).toBe('NETWORK')
    expect(mapAuthError(new TypeError('Failed to fetch')).code).toBe('NETWORK')
  })

  it('usa un mensaje genérico para lo desconocido', () => {
    expect(mapAuthError({ message: 'detalle interno' })).toEqual({
      code: 'UNKNOWN',
      message: 'No hemos podido completar la acción. Inténtalo de nuevo.',
    })
  })
})

describe('safeRedirectPath', () => {
  it('solo acepta rutas internas privadas', () => {
    expect(safeRedirectPath({ from: '/calendario?mes=2026-10' })).toBe('/calendario?mes=2026-10')
    expect(safeRedirectPath({ from: '//malicioso.example' })).toBe('/hoy')
    expect(safeRedirectPath({ from: 'https://malicioso.example' })).toBe('/hoy')
    expect(safeRedirectPath({ from: '/login' })).toBe('/hoy')
    expect(safeRedirectPath(null)).toBe('/hoy')
  })
})
