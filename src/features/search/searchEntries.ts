import { EMOTION_LABELS } from '@/features/journal/emotions.ts'
import type { Mood } from '@/features/journal/mood.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { compareLocalDates, type LocalDate } from '@/shared/lib/dates.ts'

export interface SearchFilters {
  text: string
  mood: Mood | null
  from: LocalDate | null
  to: LocalDate | null
  /** Solo días con un logro escrito. */
  onlyAchievements?: boolean
}

/** Minúsculas y sin tildes: "Día" encuentra "dia" y al revés. La ñ se conserva. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/(?!̃)[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLocaleLowerCase('es-ES')
}

function searchableText(entry: JournalEntry): string {
  return normalizeText([entry.reflection, entry.achievement, ...entry.emotions.map((e) => EMOTION_LABELS[e])].join('\n'))
}

/**
 * Filtra en el navegador las entradas propias (ya protegidas por RLS). Todas
 * las palabras buscadas deben aparecer, en cualquier orden. Resultado del más
 * reciente al más antiguo.
 */
export function searchEntries(entries: readonly JournalEntry[], filters: SearchFilters): JournalEntry[] {
  const words = normalizeText(filters.text).split(/\s+/).filter(Boolean)
  return entries
    .filter((entry) => {
      if (filters.mood && entry.mood !== filters.mood) return false
      if (filters.from && compareLocalDates(entry.date, filters.from) < 0) return false
      if (filters.to && compareLocalDates(entry.date, filters.to) > 0) return false
      if (filters.onlyAchievements && entry.achievement.trim() === '') return false
      if (words.length === 0) return true
      const haystack = searchableText(entry)
      return words.every((word) => haystack.includes(word))
    })
    .sort((a, b) => compareLocalDates(b.date, a.date))
}

export function hasActiveFilters(filters: SearchFilters): boolean {
  return filters.text.trim() !== '' || filters.mood !== null || filters.from !== null || filters.to !== null || filters.onlyAchievements === true
}

/**
 * Fragmento de la reflexión alrededor de la primera coincidencia, para no
 * mostrar textos larguísimos en la lista. Se trabaja sobre el texto original.
 */
export function excerpt(text: string, query: string, length = 180): string {
  const clean = text.trim()
  if (clean.length <= length) return clean
  const word = normalizeText(query).split(/\s+/).find(Boolean)
  const index = word ? normalizeText(clean).indexOf(word) : -1
  const start = index > 60 ? index - 60 : 0
  const slice = clean.slice(start, start + length)
  return `${start > 0 ? '…' : ''}${slice}${start + length < clean.length ? '…' : ''}`
}
