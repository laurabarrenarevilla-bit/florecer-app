import { QueryClient } from '@tanstack/react-query'
import { isAppError } from '@/shared/lib/errors.ts'

export function createQueryClient(): QueryClient {
  return new QueryClient({
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
