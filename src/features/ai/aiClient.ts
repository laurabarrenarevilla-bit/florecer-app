import { getSupabase } from '@/lib/supabase/client.ts'
import { analyzeErrorSchema, analyzeSuccessSchema, type Analysis } from './schema.ts'

export interface EntryVersion {
  id: string
  updatedAt: string
}

/** Error del análisis con un código del contrato y un mensaje apto para mostrar. */
export class AiError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AiError'
    this.code = code
  }
}

const MESSAGES = {
  network: 'No hay conexión. Comprueba tu red e inténtalo de nuevo. No se ha enviado nada.',
  session: 'Tu sesión ha terminado. Inicia sesión para continuar.',
  unknown: 'No hemos podido preparar el resumen. Tus registros siguen guardados.',
} as const

export interface AiClient {
  analyzeWeek(entries: readonly EntryVersion[]): Promise<Analysis>
}

async function currentAccessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * Llama a la función del servidor con el JWT de la sesión. Solo envía ids y
 * versiones: el servidor relee los textos con los permisos del usuario.
 */
export function createAiClient(
  getToken: () => Promise<string | null> = currentAccessToken,
  fetchFn: typeof fetch = (...args) => fetch(...args),
): AiClient {
  return {
    async analyzeWeek(entries) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AiError('NETWORK_UNAVAILABLE', MESSAGES.network)
      const token = await getToken()
      if (!token) throw new AiError('AUTH_REQUIRED', MESSAGES.session)

      let response: Response
      try {
        response = await fetchFn('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ period: '7d', entries, confirmed: true }),
        })
      } catch {
        throw new AiError('NETWORK_UNAVAILABLE', MESSAGES.network)
      }

      const json: unknown = await response.json().catch(() => null)
      if (response.ok) {
        const parsed = analyzeSuccessSchema.safeParse(json)
        if (!parsed.success) throw new AiError('AI_INVALID_RESPONSE', MESSAGES.unknown)
        return parsed.data.data
      }
      const parsedError = analyzeErrorSchema.safeParse(json)
      if (parsedError.success) throw new AiError(parsedError.data.error.code, parsedError.data.error.message)
      throw new AiError('AI_UNAVAILABLE', MESSAGES.unknown)
    },
  }
}
