import type { LocalDate } from '@/shared/lib/dates.ts'
import type { Emotion } from './emotions.ts'
import type { Mood } from './mood.ts'

export interface JournalEntry {
  id: string
  userId: string
  date: LocalDate
  mood: Mood
  /** Emociones secundarias del grupo de mood (0–3, ADR-011). */
  emotions: Emotion[]
  reflection: string
  achievement: string
  createdAt: string
  updatedAt: string
}

/** Contenido editable de una entrada (lo que escribe la persona). */
export interface JournalEntryContent {
  mood: Mood
  emotions: Emotion[]
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
