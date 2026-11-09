import type { LocalDate } from '@/shared/lib/dates.ts'
import type { Mood } from './mood.ts'

export interface JournalEntry {
  id: string
  userId: string
  date: LocalDate
  mood: Mood
  reflection: string
  achievement: string
  createdAt: string
  updatedAt: string
}

/** Contenido editable de una entrada (lo que escribe la persona). */
export interface JournalEntryContent {
  mood: Mood
  reflection: string
  achievement: string
}

export interface CreateJournalEntryInput extends JournalEntryContent {
  date: LocalDate
}

export interface UpdateJournalEntryInput extends JournalEntryContent {
  date: LocalDate
  /** updated_at conocido; si no coincide, otra pestaña lo cambió. */
  expectedUpdatedAt: string
}
