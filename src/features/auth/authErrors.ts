import { isNetworkErrorMessage } from '@/shared/lib/errors.ts'

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'EMAIL_RATE_LIMITED'
  | 'SIGNUP_DISABLED'
  | 'EMAIL_NOT_CONFIRMED'
  | 'NETWORK'
  | 'UNKNOWN'

export interface AuthFailure {
  code: AuthErrorCode
  message: string
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  USER_ALREADY_EXISTS: 'Ya existe una cuenta con este correo. Prueba a iniciar sesión.',
  WEAK_PASSWORD: 'La contraseña no cumple los requisitos: mínimo 8 caracteres, con mayúsculas, minúsculas y números.',
  INVALID_EMAIL: 'Revisa el correo electrónico: parece que no es válido.',
  RATE_LIMITED: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
  SIGNUP_DISABLED: 'El registro no está disponible ahora mismo.',
  EMAIL_RATE_LIMITED:
    'Ahora mismo no podemos enviar el correo de confirmación porque se ha alcanzado el límite de envíos. Inténtalo más tarde.',
  EMAIL_NOT_CONFIRMED:
    'Aún no has confirmado tu cuenta. Abre el enlace del correo de confirmación que te enviamos y vuelve a intentarlo.',
  NETWORK: 'No hay conexión. Comprueba tu red e inténtalo de nuevo.',
  UNKNOWN: 'No hemos podido completar la acción. Inténtalo de nuevo.',
}

const CODE_MAP: Record<string, AuthErrorCode> = {
  invalid_credentials: 'INVALID_CREDENTIALS',
  user_already_exists: 'USER_ALREADY_EXISTS',
  email_exists: 'USER_ALREADY_EXISTS',
  weak_password: 'WEAK_PASSWORD',
  email_address_invalid: 'INVALID_EMAIL',
  validation_failed: 'INVALID_EMAIL',
  over_request_rate_limit: 'RATE_LIMITED',
  over_email_send_rate_limit: 'EMAIL_RATE_LIMITED',
  signup_disabled: 'SIGNUP_DISABLED',
  email_provider_disabled: 'SIGNUP_DISABLED',
  email_not_confirmed: 'EMAIL_NOT_CONFIRMED',
}

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined
  const field: unknown = Reflect.get(value, key)
  return typeof field === 'string' ? field : undefined
}

function readNumber(value: unknown, key: string): number | undefined {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined
  const field: unknown = Reflect.get(value, key)
  return typeof field === 'number' ? field : undefined
}

function failure(code: AuthErrorCode): AuthFailure {
  return { code, message: AUTH_ERROR_MESSAGES[code] }
}

/** Traduce un error de Supabase Auth a un mensaje en español sin detalles técnicos. */
export function mapAuthError(error: unknown): AuthFailure {
  const name = readString(error, 'name') ?? ''
  const message = readString(error, 'message') ?? ''
  const status = readNumber(error, 'status')
  const code = readString(error, 'code')

  if (name === 'AuthRetryableFetchError' || status === 0 || isNetworkErrorMessage(message)) {
    return failure('NETWORK')
  }
  if (code && code in CODE_MAP) {
    const mapped = CODE_MAP[code]
    if (mapped) return failure(mapped)
  }
  if (status === 429) return failure('RATE_LIMITED')
  // Versiones antiguas de GoTrue sin "code": se reconocen por el mensaje.
  if (/invalid login credentials/i.test(message)) return failure('INVALID_CREDENTIALS')
  if (/already registered/i.test(message)) return failure('USER_ALREADY_EXISTS')
  return failure('UNKNOWN')
}
