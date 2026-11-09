import { z } from 'zod'

const supabaseEnvSchema = z.object({
  VITE_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(20),
})

export interface SupabaseEnv {
  url: string
  publishableKey: string
}

export type SupabaseEnvResult = { ok: true; env: SupabaseEnv } | { ok: false }

/**
 * Lee y valida la configuración pública de Supabase. Solo admite la URL y la
 * clave publicable/anon: nunca una clave secreta ni service_role.
 */
export function readSupabaseEnv(source: Record<string, unknown> = import.meta.env): SupabaseEnvResult {
  const parsed = supabaseEnvSchema.safeParse(source)
  if (!parsed.success) return { ok: false }
  const key = parsed.data.VITE_SUPABASE_PUBLISHABLE_KEY
  // Defensa adicional: las claves secretas de Supabase empiezan por sb_secret_.
  if (key.startsWith('sb_secret_')) return { ok: false }
  return { ok: true, env: { url: parsed.data.VITE_SUPABASE_URL, publishableKey: key } }
}
