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
        // Revalida al volver a la pestaña: detecta cambios hechos en otro dispositivo.
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (isAppError(error) && (error.code === 'AUTH_REQUIRED' || error.code === 'PERMISSION_DENIED')) return false
          return failureCount < 1
        },
      },
      mutations: {
        // Las escrituras nunca se reintentan solas: la persona decide reintentar.
        retry: false,
      },
    },
  })
}
