const DEFAULT_PRIVATE_PATH = '/hoy'
const PUBLIC_PATHS = ['/login', '/registro']

/**
 * Ruta a la que volver tras iniciar sesión. Solo admite rutas internas
 * ("/algo", nunca "//dominio" ni URLs absolutas) para evitar redirecciones abiertas.
 */
export function safeRedirectPath(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return DEFAULT_PRIVATE_PATH
  const from: unknown = Reflect.get(state, 'from')
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.includes('\\')) {
    return DEFAULT_PRIVATE_PATH
  }
  const pathname = from.split(/[?#]/)[0] ?? ''
  if (PUBLIC_PATHS.includes(pathname)) return DEFAULT_PRIVATE_PATH
  return from
}
