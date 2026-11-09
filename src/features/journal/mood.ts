/** Dominio fijo de emociones (ADR-006). Los nombres en español son solo UI. */
export const MOODS = ['happy', 'neutral', 'sad'] as const

export type Mood = (typeof MOODS)[number]

export const MOOD_LABELS: Record<Mood, string> = {
  happy: 'Feliz',
  neutral: 'Normal',
  sad: 'Triste',
}

export const REFLECTION_MAX_LENGTH = 5000
export const ACHIEVEMENT_MAX_LENGTH = 500
