/**
 * Errores de dominio (docs/17). Los mensajes son comprensibles y nunca
 * incluyen contenido del usuario, tokens ni detalles técnicos.
 */
export type AppErrorCode =
  | 'AUTH_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'ENTRY_CONFLICT'
  | 'ENTRY_NOT_FOUND'
  | 'NETWORK_UNAVAILABLE'
  | 'DB_UNAVAILABLE'
  | 'UNKNOWN'

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_REQUIRED: 'Tu sesión ha terminado. Inicia sesión para continuar.',
  PERMISSION_DENIED: 'No tienes permiso para realizar esta acción.',
  VALIDATION_ERROR: 'Revisa los datos: hay algún campo que no es válido.',
  ENTRY_CONFLICT: 'Este día ha cambiado en otra pestaña o dispositivo. Hemos cargado la versión más reciente; revisa y vuelve a guardar.',
  ENTRY_NOT_FOUND: 'Este registro ya no existe. Hemos actualizado la vista.',
  NETWORK_UNAVAILABLE: 'No hay conexión. Comprueba tu red e inténtalo de nuevo.',
  DB_UNAVAILABLE: 'El servicio no responde ahora mismo. Inténtalo de nuevo en unos minutos.',
  UNKNOWN: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
}

export class AppError extends Error {
  readonly code: AppErrorCode

  constructor(code: AppErrorCode, message: string = ERROR_MESSAGES[code]) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

const NETWORK_MESSAGE_PATTERNS = ['failed to fetch', 'networkerror', 'load failed', 'fetch failed', 'network request failed']

export function isNetworkErrorMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return NETWORK_MESSAGE_PATTERNS.some((pattern) => lower.includes(pattern))
}

interface PostgrestLikeError {
  code?: string | undefined
  message?: string | undefined
}

function isPostgrestLike(value: unknown): value is PostgrestLikeError {
  return typeof value === 'object' && value !== null && ('code' in value || 'message' in value)
}

/** Traduce errores de PostgREST/red a AppError. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error
  if (error instanceof TypeError && isNetworkErrorMessage(error.message)) {
    return new AppError('NETWORK_UNAVAILABLE')
  }
  if (!isPostgrestLike(error)) return new AppError('UNKNOWN')

  const code = error.code ?? ''
  const message = error.message ?? ''

  if (isNetworkErrorMessage(message)) return new AppError('NETWORK_UNAVAILABLE')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return new AppError('NETWORK_UNAVAILABLE')

  switch (code) {
    case '23505':
      return new AppError('ENTRY_CONFLICT')
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
    case '23502':
      return new AppError('VALIDATION_ERROR')
    case '42501':
      return new AppError('PERMISSION_DENIED')
    case 'PGRST301':
    case 'PGRST302':
    case 'PGRST303':
      return new AppError('AUTH_REQUIRED')
    default:
      break
  }

  if (/jwt/i.test(message)) return new AppError('AUTH_REQUIRED')
  if (code.startsWith('08') || code === '57P01' || code === '53300') return new AppError('DB_UNAVAILABLE')
  return new AppError('UNKNOWN')
}
