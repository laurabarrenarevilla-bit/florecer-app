import { z } from 'zod'
import { isFutureDate, isValidLocalDate, todayLocal, type LocalDate } from '@/shared/lib/dates.ts'
import { ACHIEVEMENT_MAX_LENGTH, MOODS, REFLECTION_MAX_LENGTH } from './mood.ts'
import type { JournalEntry } from './types.ts'

export const moodSchema = z.enum(MOODS, { error: 'Elige cómo te has sentido.' })

export const localDateSchema = z.string().refine(isValidLocalDate, { error: 'La fecha no es válida.' })

/** Recorta espacios en los extremos y conserva los saltos de línea internos. */
export const reflectionSchema = z
  .string()
  .trim()
  .max(REFLECTION_MAX_LENGTH, { error: `La reflexión no puede superar ${REFLECTION_MAX_LENGTH} caracteres.` })

export const achievementSchema = z
  .string()
  .trim()
  .max(ACHIEVEMENT_MAX_LENGTH, { error: `El logro no puede superar ${ACHIEVEMENT_MAX_LENGTH} caracteres.` })

export const entryContentSchema = z.object({
  mood: moodSchema,
  reflection: reflectionSchema,
  achievement: achievementSchema,
})

/** Fecha válida y no posterior a hoy (fecha local del dispositivo). */
export function notFutureDateSchema(today: LocalDate = todayLocal()) {
  return localDateSchema.refine((date) => !isFutureDate(date, today), {
    error: 'No se pueden crear registros de días futuros.',
  })
}

/** Fila de la tabla journal_entries tal como la devuelve PostgREST. */
export const journalEntryRowSchema = z
  .object({
    id: z.uuid(),
    user_id: z.uuid(),
    entry_date: localDateSchema,
    mood: z.enum(MOODS),
    reflection: z.string(),
    achievement: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform(
    (row): JournalEntry => ({
      id: row.id,
      userId: row.user_id,
      date: row.entry_date,
      mood: row.mood,
      reflection: row.reflection,
      achievement: row.achievement,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  )

export const journalEntryRowsSchema = z.array(journalEntryRowSchema)
