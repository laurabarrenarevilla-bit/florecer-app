import { vi } from 'vitest'
import type { JournalRepository } from '@/features/journal/journalRepository.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import type { LocalDate } from '@/shared/lib/dates.ts'
import { AppError } from '@/shared/lib/errors.ts'
import { TEST_USER } from './fakeAuth.tsx'

/**
 * Repositorio del diario en memoria, solo para pruebas de componentes.
 * Reproduce las reglas del backend que importan a la UI: una entrada por día
 * y edición condicionada a updated_at.
 */
export function createFakeJournalRepository(initial: JournalEntry[] = []) {
  const rows = new Map<LocalDate, JournalEntry>(initial.map((entry) => [entry.date, entry]))
  let tick = 0
  const nextTimestamp = () => {
    tick += 1
    return `2026-01-01T00:00:${String(tick).padStart(2, '0')}.000000+00:00`
  }

  const repository = {
    listBetween: vi.fn<JournalRepository['listBetween']>(async (from, to) =>
      [...rows.values()].filter((e) => e.date >= from && e.date <= to).sort((a, b) => a.date.localeCompare(b.date)),
    ),
    getByDate: vi.fn<JournalRepository['getByDate']>(async (date) => rows.get(date) ?? null),
    create: vi.fn<JournalRepository['create']>(async (input) => {
      if (rows.has(input.date)) throw new AppError('ENTRY_CONFLICT')
      const now = nextTimestamp()
      const entry: JournalEntry = {
        id: `00000000-0000-4000-8000-${String(rows.size + 1).padStart(12, '0')}`,
        userId: TEST_USER.id,
        date: input.date,
        mood: input.mood,
        reflection: input.reflection,
        achievement: input.achievement,
        createdAt: now,
        updatedAt: now,
      }
      rows.set(entry.date, entry)
      return entry
    }),
    update: vi.fn<JournalRepository['update']>(async (input) => {
      const current = rows.get(input.date)
      if (!current || current.updatedAt !== input.expectedUpdatedAt) throw new AppError('ENTRY_CONFLICT')
      const entry: JournalEntry = {
        ...current,
        mood: input.mood,
        reflection: input.reflection,
        achievement: input.achievement,
        updatedAt: nextTimestamp(),
      }
      rows.set(entry.date, entry)
      return entry
    }),
    deleteByDate: vi.fn<JournalRepository['deleteByDate']>(async (date) => {
      if (!rows.delete(date)) throw new AppError('ENTRY_NOT_FOUND')
    }),
  } satisfies JournalRepository

  return { repository, rows }
}

/** Entrada sintética para pruebas (sin contenido real de ninguna persona). */
export function buildEntry(overrides: Partial<JournalEntry> & Pick<JournalEntry, 'date'>): JournalEntry {
  return {
    id: '00000000-0000-4000-8000-0000000000aa',
    userId: TEST_USER.id,
    mood: 'neutral',
    reflection: '',
    achievement: '',
    createdAt: '2026-01-01T00:00:00.000000+00:00',
    updatedAt: '2026-01-01T00:00:00.000000+00:00',
    ...overrides,
  }
}
