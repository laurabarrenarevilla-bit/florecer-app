import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseEnv } from './env.ts'

let client: SupabaseClient | null = null

/**
 * Cliente único de Supabase para el navegador, creado bajo demanda.
 * La sesión (tokens, nunca contenido del diario) se persiste en localStorage
 * para mantenerla tras recargar.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client
  const result = readSupabaseEnv()
  if (!result.ok) {
    throw new Error('Configuración de Supabase ausente o no válida.')
  }
  client = createClient(result.env.url, result.env.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })
  return client
}
