/**
 * Aplica las migraciones reales de supabase/migrations sobre PGlite con un
 * esquema auth mínimo que imita a Supabase (roles anon/authenticated y
 * auth.uid() leído del JWT de la petición), y comprueba restricciones y RLS.
 *
 *   pnpm test:db
 *
 * Solo datos sintéticos en memoria; no hay red ni credenciales.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations')
const USER_A = '00000000-0000-4000-8000-00000000000a'
const USER_B = '00000000-0000-4000-8000-00000000000b'

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;
  -- Supabase concede por defecto todo a anon/authenticated en public.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');
`

let db: PGlite

async function as<T>(user: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ''}', false);`)
  await db.exec(user ? 'set role authenticated' : 'set role anon')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

function insert(user: string, date: string, mood: string, emotions: string[] = []) {
  return as(user, () =>
    db.query<{ user_id: string; emotions: string[] }>('insert into public.journal_entries (entry_date, mood, emotions) values ($1, $2, $3) returning user_id, emotions', [
      date,
      mood,
      emotions,
    ]),
  )
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUB)
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
  }
})

beforeEach(async () => {
  await db.exec('reset role; delete from public.journal_entries;')
})

describe('journal_entries.emotions', () => {
  it('por defecto es una lista vacía (entradas antiguas y sin emociones)', async () => {
    const { rows } = await insert(USER_A, '2026-11-01', 'happy')
    expect(rows[0]).toMatchObject({ user_id: USER_A, emotions: [] })
  })

  it('acepta hasta 3 emociones del grupo del ánimo', async () => {
    const { rows } = await insert(USER_A, '2026-11-01', 'sad', ['melancholy', 'anger', 'fear'])
    expect(rows[0]?.emotions).toEqual(['melancholy', 'anger', 'fear'])
  })

  it('rechaza más de 3', async () => {
    await expect(insert(USER_A, '2026-11-01', 'sad', ['melancholy', 'anger', 'fear', 'remorse'])).rejects.toThrow(
      /journal_entries_emotions_max/,
    )
  })

  it('rechaza emociones de otro grupo', async () => {
    await expect(insert(USER_A, '2026-11-01', 'sad', ['optimism'])).rejects.toThrow(/journal_entries_emotions_match_mood/)
  })

  it('rechaza códigos desconocidos', async () => {
    await expect(insert(USER_A, '2026-11-01', 'happy', ['alegria'])).rejects.toThrow(/journal_entries_emotions_match_mood/)
  })

  it('rechaza repetidas', async () => {
    await expect(insert(USER_A, '2026-11-01', 'happy', ['love', 'love'])).rejects.toThrow(/repetidas/)
  })

  it('rechaza cambiar el ánimo sin cambiar las emociones', async () => {
    await insert(USER_A, '2026-11-01', 'happy', ['love'])
    await expect(
      as(USER_A, () => db.query(`update public.journal_entries set mood = 'sad' where entry_date = '2026-11-01'`)),
    ).rejects.toThrow(/journal_entries_emotions_match_mood/)
  })

  it('authenticated puede actualizar emociones y ánimo a la vez', async () => {
    await insert(USER_A, '2026-11-01', 'happy', ['love'])
    const { rows } = await as(USER_A, () =>
      db.query(
        `update public.journal_entries set mood = 'neutral', emotions = '{boredom}' where entry_date = '2026-11-01' returning emotions`,
      ),
    )
    expect(rows[0]).toMatchObject({ emotions: ['boredom'] })
  })
})

describe('RLS con dos cuentas (local)', () => {
  it('B no ve ni modifica las emociones de A', async () => {
    await insert(USER_A, '2026-11-01', 'happy', ['love'])
    const seen = await as(USER_B, () => db.query('select id from public.journal_entries'))
    expect(seen.rows).toHaveLength(0)
    const updated = await as(USER_B, () =>
      db.query(`update public.journal_entries set emotions = '{trust}' where entry_date = '2026-11-01' returning id`),
    )
    expect(updated.rows).toHaveLength(0)
    const mine = await as(USER_A, () => db.query<{ emotions: string[] }>('select emotions from public.journal_entries'))
    expect(mine.rows[0]?.emotions).toEqual(['love'])
  })

  it('anon no lee nada', async () => {
    await insert(USER_A, '2026-11-01', 'happy')
    await expect(as(null, () => db.query('select id from public.journal_entries'))).rejects.toThrow(/permission denied/)
  })

  it('authenticated no puede cambiar user_id', async () => {
    await insert(USER_A, '2026-11-01', 'happy')
    await expect(
      as(USER_A, () => db.query(`update public.journal_entries set user_id = '${USER_B}'`)),
    ).rejects.toThrow(/permission denied/)
  })
})

describe('cuota de IA (consume_ai_quota)', () => {
  beforeEach(async () => {
    await db.exec('reset role; delete from public.ai_usage;')
  })

  const consume = (user: string | null) => as(user, () => db.query('select public.consume_ai_quota()'))

  it('permite una petición y bloquea la siguiente en el mismo minuto', async () => {
    await consume(USER_A)
    await expect(consume(USER_A)).rejects.toThrow(/AI_RATE_LIMIT_MINUTE/)
  })

  it('la cuota es por persona', async () => {
    await consume(USER_A)
    await expect(consume(USER_B)).resolves.toBeDefined()
  })

  it('bloquea a partir de 10 peticiones en 24 horas', async () => {
    await db.exec(`insert into public.ai_usage (user_id, created_at)
      select '${USER_A}', now() - (n || ' hours')::interval from generate_series(1, 10) as n`)
    await expect(consume(USER_A)).rejects.toThrow(/AI_RATE_LIMIT_DAY/)
  })

  it('las marcas de más de 2 días se limpian al consumir', async () => {
    await db.exec(`insert into public.ai_usage (user_id, created_at) values ('${USER_A}', now() - interval '3 days')`)
    await consume(USER_A)
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.ai_usage where user_id = '${USER_A}'`)
    expect(rows[0]?.n).toBe(1)
  })

  it('anon no puede consumir y authenticated no puede leer ni escribir la tabla', async () => {
    await expect(consume(null)).rejects.toThrow(/permission denied/)
    await expect(as(USER_A, () => db.query('select * from public.ai_usage'))).rejects.toThrow(/permission denied/)
    await expect(
      as(USER_A, () => db.query(`insert into public.ai_usage (user_id) values ('${USER_A}')`)),
    ).rejects.toThrow(/permission denied/)
  })
})
