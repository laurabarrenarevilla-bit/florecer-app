import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client.ts'
import type { LocalDate } from '@/shared/lib/dates.ts'
import { AppError, toAppError } from '@/shared/lib/errors.ts'
import { entryContentSchema, journalEntryRowSchema, journalEntryRowsSchema, localDateSchema, notFutureDateSchema } from './schema.ts'
import type { CreateJournalEntryInput, JournalEntry, UpdateJournalEntryInput } from './types.ts'

const TABLE = 'journal_entries'
const COLUMNS = 'id, user_id, entry_date, mood, reflection, achievement, created_at, updated_at'

export interface JournalRepository {
  listBetween(from: LocalDate, to: LocalDate): Promise<JournalEntry[]>
  getByDate(date: LocalDate): Promise<JournalEntry | null>
  create(input: CreateJournalEntryInput): Promise<JournalEntry>
  update(input: UpdateJournalEntryInput): Promise<JournalEntry>
  deleteByDate(date: LocalDate): Promise<void>
}

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
      const { data, error } = await getClient()
        .from(TABLE)
        .select(COLUMNS)
        .eq('entry_date', validateDate(date))
        .maybeSingle()
      if (error) throw toAppError(error)
      return data === null ? null : parseRow(data)
    },

    async create(input) {
      const dateResult = notFutureDateSchema().safeParse(input.date)
      if (!dateResult.success) throw new AppError('VALIDATION_ERROR')
      const content = validateContent(input)
      const { data, error } = await getClient()
        .from(TABLE)
        .insert({
          entry_date: dateResult.data,
          mood: content.mood,
          reflection: content.reflection,
          achievement: content.achievement,
        })
        .select(COLUMNS)
        .single()
      if (error) throw toAppError(error)
      return parseRow(data)
    },

    async update(input) {
      const date = validateDate(input.date)
      const content = validateContent(input)
      const { data, error } = await getClient()
        .from(TABLE)
        .update({ mood: content.mood, reflection: content.reflection, achievement: content.achievement })
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
      const { data, error } = await getClient()
        .from(TABLE)
        .delete()
        .eq('entry_date', validateDate(date))
        .select('id')
      if (error) throw toAppError(error)
      if (!Array.isArray(data) || data.length === 0) throw new AppError('ENTRY_NOT_FOUND')
    },
  }
}

export const journalRepository: JournalRepository = createJournalRepository(getSupabase)
