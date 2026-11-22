import { EMOTION_LABELS, type Emotion } from '@/features/journal/emotions.ts'
import { MOOD_LABELS, MOODS, type Mood } from '@/features/journal/mood.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { addCalendarDays, weekdayMondayFirst, type LocalDate } from '@/shared/lib/dates.ts'

/**
 * Estadísticas de Evolución (docs/13). Todo se deriva de las entradas reales
 * del período: nada se guarda ni se inventa. Funciones puras para poder
 * comprobar las cifras con fixtures.
 */

export interface MoodShare {
  mood: Mood
  count: number
  /** Sobre días registrados (0–100, sin redondear). */
  percentage: number
}

export interface EmotionShare {
  emotion: Emotion
  mood: Mood
  count: number
  /** Sobre entradas con al menos una emoción (0–100, sin redondear). */
  percentage: number
}

export interface PeriodSummary {
  registeredDays: number
  /** Días del período hasta hoy (los futuros no cuentan como ausencias). */
  elapsedDays: number
  moods: MoodShare[]
  /** Entradas con al menos una emoción secundaria (denominador de emotions). */
  entriesWithEmotions: number
  /** Ordenadas por frecuencia descendente; desempate alfabético estable. */
  emotions: EmotionShare[]
  achievementDays: number
  longestStreak: number
}

function percentage(count: number, total: number): number {
  return total === 0 ? 0 : (count / total) * 100
}

/** Racha más larga de fechas civiles consecutivas con entrada. */
export function longestStreak(dates: readonly LocalDate[]): number {
  const sorted = [...new Set(dates)].sort()
  let best = 0
  let current = 0
  let previous: LocalDate | null = null
  for (const date of sorted) {
    current = previous !== null && addCalendarDays(previous, 1) === date ? current + 1 : 1
    best = Math.max(best, current)
    previous = date
  }
  return best
}

export function summarize(entries: readonly JournalEntry[], elapsedDays: number): PeriodSummary {
  const registeredDays = entries.length
  const moodCounts = new Map<Mood, number>(MOODS.map((mood) => [mood, 0]))
  const emotionCounts = new Map<Emotion, { mood: Mood; count: number }>()
  let entriesWithEmotions = 0
  let achievementDays = 0

  for (const entry of entries) {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1)
    if (entry.emotions.length > 0) entriesWithEmotions += 1
    for (const emotion of entry.emotions) {
      const current = emotionCounts.get(emotion)
      emotionCounts.set(emotion, { mood: entry.mood, count: (current?.count ?? 0) + 1 })
    }
    if (entry.achievement.trim() !== '') achievementDays += 1
  }

  return {
    registeredDays,
    elapsedDays,
    moods: MOODS.map((mood) => {
      const count = moodCounts.get(mood) ?? 0
      return { mood, count, percentage: percentage(count, registeredDays) }
    }),
    entriesWithEmotions,
    emotions: [...emotionCounts.entries()]
      .map(([emotion, { mood, count }]) => ({ emotion, mood, count, percentage: percentage(count, entriesWithEmotions) }))
      .sort((a, b) => b.count - a.count || EMOTION_LABELS[a.emotion].localeCompare(EMOTION_LABELS[b.emotion], 'es')),
    achievementDays,
    longestStreak: longestStreak(entries.map((entry) => entry.date)),
  }
}

/** Porcentaje para mostrar (entero). La suma puede no dar exactamente 100. */
export function formatPercentage(value: number): string {
  return `${Math.round(value)} %`
}

// --- Patrones descriptivos ---------------------------------------------------

/** Mínimo de días registrados para mostrar patrones (docs/13). */
export const MIN_DAYS_FOR_PATTERNS = 5
/** Mínimo de registros de un día de la semana para hablar de él. */
const MIN_WEEKDAY_ENTRIES = 2

const WEEKDAY_PLURALS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'] as const

function joinSpanish(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

function quoted(label: string): string {
  return `«${label}»`
}

function topBy<T>(items: readonly T[], count: (item: T) => number): T[] {
  const max = Math.max(0, ...items.map(count))
  return max === 0 ? [] : items.filter((item) => count(item) === max)
}

/**
 * Observaciones en pasado, sin valorar ni predecir (ADR-011 §4). Si hay
 * empate se nombran todas las opciones empatadas. Devuelve [] si hay pocos datos.
 */
export function describePatterns(entries: readonly JournalEntry[], summary: PeriodSummary): string[] {
  if (summary.registeredDays < MIN_DAYS_FOR_PATTERNS) return []
  const patterns: string[] = []
  const total = summary.registeredDays

  const topMoods = topBy(summary.moods, (m) => m.count)
  const [firstMood] = topMoods
  if (firstMood) {
    const names = joinSpanish(topMoods.map((m) => quoted(MOOD_LABELS[m.mood])))
    patterns.push(
      topMoods.length === 1
        ? `El ánimo que más registraste fue ${names}: ${firstMood.count} de ${total} días.`
        : `Registraste ${names} el mismo número de días: ${firstMood.count} de ${total} cada uno.`,
    )
  }

  const topEmotions = topBy(summary.emotions, (e) => e.count)
  const [firstEmotion] = topEmotions
  if (firstEmotion && firstEmotion.count >= 2) {
    const names = joinSpanish(topEmotions.map((e) => quoted(EMOTION_LABELS[e.emotion])))
    patterns.push(
      topEmotions.length === 1
        ? `La emoción concreta que más marcaste fue ${names}: ${firstEmotion.count} días.`
        : `Las emociones concretas que más marcaste fueron ${names}: ${firstEmotion.count} días cada una.`,
    )
  }

  const byWeekday = Array.from({ length: 7 }, () => new Map<Mood, number>())
  for (const entry of entries) {
    const counts = byWeekday[weekdayMondayFirst(entry.date)]
    counts?.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1)
  }
  byWeekday.forEach((counts, weekday) => {
    const totalOfDay = [...counts.values()].reduce((sum, n) => sum + n, 0)
    if (totalOfDay < MIN_WEEKDAY_ENTRIES) return
    const top = topBy([...counts.entries()], ([, n]) => n)
    const [first] = top
    // Solo si un ánimo destaca claramente: único y en más de la mitad de esos días.
    if (top.length !== 1 || !first || first[1] * 2 <= totalOfDay) return
    patterns.push(
      `Los ${WEEKDAY_PLURALS[weekday]} registraste sobre todo ${quoted(MOOD_LABELS[first[0]])}: ${first[1]} de ${totalOfDay}.`,
    )
  })

  if (summary.longestStreak >= 2) {
    patterns.push(`Tu racha más larga fue de ${summary.longestStreak} días seguidos con registro.`)
  }

  if (summary.achievementDays > 0) {
    patterns.push(`Apuntaste un logro en ${summary.achievementDays} de ${total} días.`)
  }

  return patterns
}
