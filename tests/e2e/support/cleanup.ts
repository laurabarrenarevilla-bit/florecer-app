import { createClient } from '@supabase/supabase-js'
import { supabasePublicConfig, type TestAccount } from './env.ts'

/**
 * Borra entradas de UNA cuenta de prueba en fechas concretas, iniciando sesión
 * como ella con la clave publicable: la RLS impide tocar filas de otra cuenta.
 * Nunca hay limpiezas globales ni se usa service_role.
 */
export async function deleteOwnEntries(account: TestAccount, dates: string[]): Promise<void> {
  const { url, key } = supabasePublicConfig()
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: signInError } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (signInError) throw new Error(`No se pudo iniciar sesión con la cuenta de prueba ${account.label} para limpiar.`)
  const { error } = await client.from('journal_entries').delete().in('entry_date', dates)
  await client.auth.signOut()
  if (error) throw new Error(`No se pudieron borrar las entradas de prueba de ${account.label} (${error.code}).`)
}

/** Cuenta las filas propias de la cuenta en una fecha (para comprobar que no hay duplicados). */
export async function countOwnEntries(account: TestAccount, date: string): Promise<number> {
  const { url, key } = supabasePublicConfig()
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: signInError } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (signInError) throw new Error(`No se pudo iniciar sesión con la cuenta de prueba ${account.label}.`)
  const { count, error } = await client.from('journal_entries').select('id', { count: 'exact', head: true }).eq('entry_date', date)
  await client.auth.signOut()
  if (error) throw new Error(`No se pudo contar (${error.code}).`)
  return count ?? 0
}
