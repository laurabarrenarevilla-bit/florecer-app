import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase/client.ts'
import { todayLocal, type LocalDate } from '@/shared/lib/dates.ts'
import { AppError, toAppError } from '@/shared/lib/errors.ts'
import { entryContentSchema, journalEntryRowSchema, journalEntryRowsSchema, localDateSchema, notFutureDateSchema } from './schema.ts'
import type { CreateJournalEntryInput, JournalEntry, UpdateJournalEntryInput } from './types.ts'

const TABLE = 'journal_entries'
const COLUMNS = 'id, user_id, entry_date, mood, emotions, reflection, achievement, created_at, updated_at'

export interface JournalRepository {
  listBetween(from: LocalDate, to: LocalDate): Promise<JournalEntry[]>
  getByDate(date: LocalDate): Promise<JournalEntry | null>
  create(input: CreateJournalEntryInput): Promise<JournalEntry>
  update(input: UpdateJournalEntryInput): Promise<JournalEntry>
  deleteByDate(date: LocalDate): Promise<void>
  /** Todas las entradas propias, paginando (PostgREST limita filas por respuesta). */
  listAll(): Promise<JournalEntry[]>
  /**
   * Inserta entradas nuevas y OMITE las fechas que ya existen (nunca
   * sobrescribe). Devuelve las fechas realmente insertadas. Lanza si falla;
   * los lotes ya insertados quedan guardados (se informa del parcial).
   */
  insertMissing(inputs: readonly CreateJournalEntryInput[]): Promise<{ inserted: LocalDate[] }>
}

const PAGE_SIZE = 1000
const IMPORT_BATCH = 200

function parseRow(data: unknown): JournalEntry {
  const parsed = journalEntryRowSchema.safeParse(data)
  if (!parsed.success) throw new AppError('UNKNOWN')
  return parsed.data
}

function parseRows(data: unknown): JournalEntry[] {
  const parsed = journalEntryRowsSchema.safeParse(data)
  if (!parsed.success) throw new AppError('UNKNOWN')
  return parsed.data
}

/**
 * Sin conexión no se llama a Supabase: postgrest-js reintentaría cada lectura
 * varios segundos antes de fallar. navigator.onLine === false es fiable
 * (true no lo es, por eso solo se usa en ese sentido).
 */
function assertOnline(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AppError('NETWORK_UNAVAILABLE')
}

function validateDate(date: LocalDate): LocalDate {
  const parsed = localDateSchema.safeParse(date)
  if (!parsed.success) throw new AppError('VALIDATION_ERROR')
  return parsed.data
}

function validateContent(input: CreateJournalEntryInput | UpdateJournalEntryInput) {
  const parsed = entryContentSchema.safeParse(input)
  if (!parsed.success) throw new AppError('VALIDATION_ERROR')
  return parsed.data
}

/**
 * Acceso a journal_entries. La autorización la aplica PostgreSQL (RLS por
 * auth.uid()); aquí nunca se envía user_id ni se filtra por él.
 */
export function createJournalRepository(getClient: () => SupabaseClient): JournalRepository {
  return {
    async listBetween(from, to) {
      assertOnline()
      const { data, error } = await getClient()
        .from(TABLE)
        .select(COLUMNS)
        .gte('entry_date', validateDate(from))
        .lte('entry_date', validateDate(to))
        .order('entry_date', { ascending: true })
      if (error) throw toAppError(error)
      return parseRows(data)
    },

    async getByDate(date) {
      assertOnline()
      const { data, error } = await getClient()
        .from(TABLE)
        .select(COLUMNS)
        .eq('entry_date', validateDate(date))
        .maybeSingle()
      if (error) throw toAppError(error)
      return data === null ? null : parseRow(data)
    },

    async create(input) {
      assertOnline()
      const dateResult = notFutureDateSchema().safeParse(input.date)
      if (!dateResult.success) throw new AppError('VALIDATION_ERROR')
      const content = validateContent(input)
      const { data, error } = await getClient()
        .from(TABLE)
        .insert({
          entry_date: dateResult.data,
          mood: content.mood,
          emotions: content.emotions,
          reflection: content.reflection,
          achievement: content.achievement,
        })
        .select(COLUMNS)
        .single()
      if (error) throw toAppError(error)
      return parseRow(data)
    },

    async update(input) {
      assertOnline()
      const date = validateDate(input.date)
      const content = validateContent(input)
      const { data, error } = await getClient()
        .from(TABLE)
        .update({ mood: content.mood, emotions: content.emotions, reflection: content.reflection, achievement: content.achievement })
        .eq('entry_date', date)
        .eq('updated_at', input.expectedUpdatedAt)
        .select(COLUMNS)
      if (error) throw toAppError(error)
      const rows = parseRows(data)
      const [row] = rows
      // 0 filas: otra pestaña la modificó o la eliminó entre medias.
      if (!row) throw new AppError('ENTRY_CONFLICT')
      return row
    },

    async deleteByDate(date) {
      assertOnline()
      const { data, error } = await getClient()
        .from(TABLE)
        .delete()
        .eq('entry_date', validateDate(date))
        .select('id')
      if (error) throw toAppError(error)
      if (!Array.isArray(data) || data.length === 0) throw new AppError('ENTRY_NOT_FOUND')
    },

    async listAll() {
      assertOnline()
      const all: JournalEntry[] = []
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await getClient()
          .from(TABLE)
          .select(COLUMNS)
          .order('entry_date', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)
        if (error) throw toAppError(error)
        const page = parseRows(data)
        all.push(...page)
        if (page.length < PAGE_SIZE) return all
      }
    },

    async insertMissing(inputs) {
      assertOnline()
      const today = todayLocal()
      const rows = inputs.map((input) => {
        const dateResult = notFutureDateSchema(today).safeParse(input.date)
        if (!dateResult.success) throw new AppError('VALIDATION_ERROR')
        const content = validateContent(input)
        return {
          entry_date: dateResult.data,
          mood: content.mood,
          emotions: content.emotions,
          reflection: content.reflection,
          achievement: content.achievement,
        }
      })
      const inserted: LocalDate[] = []
      for (let i = 0; i < rows.length; i += IMPORT_BATCH) {
        // ON CONFLICT DO NOTHING: las fechas existentes se omiten sin tocarlas.
        const { data, error } = await getClient()
          .from(TABLE)
          .upsert(rows.slice(i, i + IMPORT_BATCH), { onConflict: 'user_id,entry_date', ignoreDuplicates: true })
          .select('entry_date')
        if (error) throw new PartialImportError(toAppError(error), inserted)
        const parsed = z.array(z.object({ entry_date: localDateSchema })).safeParse(data)
        if (!parsed.success) throw new PartialImportError(new AppError('UNKNOWN'), inserted)
        inserted.push(...parsed.data.map((row) => row.entry_date))
      }
      return { inserted }
    },
  }
}

export class PartialImportError extends AppError {
  readonly inserted: LocalDate[]
  constructor(cause: AppError, inserted: LocalDate[]) {
    super(cause.code, cause.message)
    this.inserted = inserted
  }
}

export const journalRepository: JournalRepository = createJournalRepository(getSupabase)
