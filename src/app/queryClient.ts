import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isAppError } from '@/shared/lib/errors.ts'

type Listener = () => void
const authRequiredListeners = new Set<Listener>()

/**
 * Avisa cuando el backend rechaza la sesión (JWT caducado o revocado).
 * AuthProvider lo escucha para cerrar la sesión local y llevar a /login.
 */
export function subscribeToAuthRequired(listener: Listener): () => void {
  authRequiredListeners.add(listener)
  return () => authRequiredListeners.delete(listener)
}

/** Errores que no se arreglan reintentando: sesión, permisos, datos o configuración del proyecto. */
const PERMANENT_ERRORS = new Set(['AUTH_REQUIRED', 'PERMISSION_DENIED', 'VALIDATION_ERROR', 'DB_NOT_READY'])

export function isPermanentError(error: unknown): boolean {
  return isAppError(error) && PERMANENT_ERRORS.has(error.code)
}

/**
 * React Query no reintenta fallos de red: postgrest-js ya reintenta cada
 * lectura hasta 3 veces (1, 2 y 4 s). Dos capas sumaban ~16 s de "Cargando…".
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isPermanentError(error)) return false
  if (isAppError(error) && error.code === 'NETWORK_UNAVAILABLE') return false
  return failureCount < 1
}

function notifyIfAuthRequired(error: unknown) {
  if (isAppError(error) && error.code === 'AUTH_REQUIRED') {
    for (const listener of authRequiredListeners) listener()
  }
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: notifyIfAuthRequired }),
    mutationCache: new MutationCache({ onError: notifyIfAuthRequired }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Sin pausas silenciosas al perder la red: la petición se intenta y, si
        // falla, se muestra "No hay conexión" con opción de reintentar (F1-13).
        networkMode: 'always',
        // Revalida al volver a la pestaña: detecta cambios hechos en otro dispositivo.
        refetchOnWindowFocus: true,
        // Un reintento solo para fallos transitorios (red, servicio caído).
        retry: shouldRetryQuery,
      },
      mutations: {
        // Las escrituras nunca se reintentan solas: la persona decide reintentar.
        retry: false,
        // Sin red, TanStack Query pausaría el guardado y el botón quedaría en
        // "Guardando…" indefinidamente; así falla al momento con un aviso claro.
        networkMode: 'always',
      },
    },
  })
}
