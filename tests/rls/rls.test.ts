/**
 * Aislamiento RLS entre dos cuentas registradas por el registro público.
 * Usa SOLO la clave publicable (nunca service_role) para no eludir la RLS.
 * Escribe y borra filas propias de test-a/test-b en fechas antiguas reservadas.
 *
 *   pnpm test:rls   (necesita .env.test.local con las variables de abajo)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createJournalRepository } from '@/features/journal/journalRepository.ts'
import { addCalendarDays, todayLocal } from '@/shared/lib/dates.ts'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable ${name} en .env.test.local`)
  return value
}

const url = requireEnv('VITE_SUPABASE_URL')
const key = requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
if (key.startsWith('sb_secret_')) throw new Error('Las pruebas RLS no pueden usar una clave secreta.')

// Fechas reservadas para pruebas: no coinciden con uso real.
const DATE_A = '2000-01-03'
const DATE_SHARED = '2000-01-04'

function newClient(): SupabaseClient {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function signInOrRegister(client: SupabaseClient, email: string, password: string): Promise<string> {
  const signIn = await client.auth.signInWithPassword({ email, password })
  if (signIn.data.user) return signIn.data.user.id
  // Primera ejecución: la cuenta de prueba se crea por el registro público.
  const signUp = await client.auth.signUp({ email, password })
  if (signUp.error || !signUp.data.session || !signUp.data.user) {
    throw new Error('No se pudo iniciar sesión ni registrar la cuenta de prueba.')
  }
  return signUp.data.user.id
}

let clientA: SupabaseClient
let clientB: SupabaseClient
let userA = ''
let userB = ''

async function cleanup() {
  await clientA?.from('journal_entries').delete().in('entry_date', [DATE_A, DATE_SHARED])
  await clientB?.from('journal_entries').delete().in('entry_date', [DATE_A, DATE_SHARED])
}

beforeAll(async () => {
  clientA = newClient()
  clientB = newClient()
  userA = await signInOrRegister(clientA, requireEnv('TEST_A_EMAIL'), requireEnv('TEST_A_PASSWORD'))
  userB = await signInOrRegister(clientB, requireEnv('TEST_B_EMAIL'), requireEnv('TEST_B_PASSWORD'))
  expect(userA).not.toBe(userB)
  await cleanup()
})

afterAll(async () => {
  await cleanup()
  await clientA?.auth.signOut()
  await clientB?.auth.signOut()
})

describe('RLS journal_entries', () => {
  it('A crea su entrada y el servidor asigna su user_id', async () => {
    const repoA = createJournalRepository(() => clientA)
    const entry = await repoA.create({ date: DATE_A, mood: 'happy', reflection: 'prueba sintética', achievement: '' })
    expect(entry.userId).toBe(userA)
    expect(entry.date).toBe(DATE_A)
  })

  it('una segunda entrada en la misma fecha es rechazada (una por día)', async () => {
    const { error } = await clientA.from('journal_entries').insert({ entry_date: DATE_A, mood: 'sad' })
    expect(error?.code).toBe('23505')
  })

  it('B no ve las entradas de A', async () => {
    const { data, error } = await clientB.from('journal_entries').select('id, user_id')
    expect(error).toBeNull()
    expect((data ?? []).some((row) => row.user_id === userA)).toBe(false)
  })

  it('B no puede modificar ni borrar la entrada de A', async () => {
    const update = await clientB.from('journal_entries').update({ mood: 'sad' }).eq('entry_date', DATE_A).select('id')
    expect(update.data ?? []).toHaveLength(0)
    const del = await clientB.from('journal_entries').delete().eq('entry_date', DATE_A).select('id')
    expect(del.data ?? []).toHaveLength(0)

    const check = await clientA.from('journal_entries').select('mood').eq('entry_date', DATE_A).single()
    expect(check.data?.mood).toBe('happy')
  })

  it('B no puede insertar filas con el user_id de A', async () => {
    const { error } = await clientB.from('journal_entries').insert({ user_id: userA, entry_date: DATE_SHARED, mood: 'sad' })
    expect(error).not.toBeNull()
  })

  it('un upsert de B sobre la fecha de A no toca la fila de A', async () => {
    await clientB.from('journal_entries').upsert({ entry_date: DATE_A, mood: 'sad' }, { onConflict: 'user_id,entry_date' })
    const check = await clientA.from('journal_entries').select('mood').eq('entry_date', DATE_A).single()
    expect(check.data?.mood).toBe('happy')
  })

  it('A no puede cambiar el user_id de su fila', async () => {
    const { error } = await clientA.from('journal_entries').update({ user_id: userB }).eq('entry_date', DATE_A)
    expect(error).not.toBeNull()
  })

  it('la base de datos rechaza fechas futuras', async () => {
    const future = addCalendarDays(todayLocal(), 3)
    const { error } = await clientA.from('journal_entries').insert({ entry_date: future, mood: 'happy' })
    expect(error).not.toBeNull()
  })

  it('una edición con updated_at desactualizado no sobrescribe (ENTRY_CONFLICT)', async () => {
    const repoA = createJournalRepository(() => clientA)
    await expect(
      repoA.update({
        date: DATE_A,
        mood: 'neutral',
        reflection: '',
        achievement: '',
        expectedUpdatedAt: '1999-01-01T00:00:00+00:00',
      }),
    ).rejects.toMatchObject({ code: 'ENTRY_CONFLICT' })
  })

  it('un cliente anónimo no lee ninguna entrada', async () => {
    const anon = newClient()
    const { data } = await anon.from('journal_entries').select('id')
    expect(data ?? []).toHaveLength(0)
  })

  it('A borra su entrada y deja de existir', async () => {
    const repoA = createJournalRepository(() => clientA)
    await repoA.deleteByDate(DATE_A)
    expect(await repoA.getByDate(DATE_A)).toBeNull()
  })
})
