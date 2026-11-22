import type { Mood } from './mood.ts'

/**
 * Emociones secundarias por ánimo (ADR-011, rueda de Plutchik). Los códigos
 * coinciden con la restricción journal_entries_emotions_match_mood de la
 * migración 20261122000000; si cambian aquí, deben cambiar allí.
 */
export const EMOTIONS_BY_MOOD = {
  happy: ['serenity', 'optimism', 'love', 'trust', 'interest', 'admiration'],
  neutral: ['acceptance', 'anticipation', 'surprise', 'distraction', 'boredom'],
  sad: ['melancholy', 'disappointment', 'remorse', 'fear', 'anger', 'disgust'],
} as const satisfies Record<Mood, readonly string[]>

export type Emotion = (typeof EMOTIONS_BY_MOOD)[Mood][number]

export const EMOTIONS: readonly Emotion[] = [
  ...EMOTIONS_BY_MOOD.happy,
  ...EMOTIONS_BY_MOOD.neutral,
  ...EMOTIONS_BY_MOOD.sad,
]

export const MAX_EMOTIONS = 3

export const EMOTION_LABELS: Record<Emotion, string> = {
  serenity: 'Serenidad',
  optimism: 'Optimismo',
  love: 'Amor',
  trust: 'Confianza',
  interest: 'Interés',
  admiration: 'Admiración',
  acceptance: 'Aceptación',
  anticipation: 'Anticipación',
  surprise: 'Sorpresa',
  distraction: 'Distracción',
  boredom: 'Aburrimiento',
  melancholy: 'Melancolía',
  disappointment: 'Decepción',
  remorse: 'Remordimiento',
  fear: 'Miedo',
  anger: 'Enfado',
  disgust: 'Asco',
}

export function emotionsForMood(mood: Mood): readonly Emotion[] {
  return EMOTIONS_BY_MOOD[mood]
}

export function isEmotionOfMood(emotion: Emotion, mood: Mood): boolean {
  return emotionsForMood(mood).includes(emotion)
}

/** Al cambiar de ánimo se conservan solo las emociones que siguen encajando. */
export function keepEmotionsOfMood(emotions: readonly Emotion[], mood: Mood): Emotion[] {
  return emotions.filter((emotion) => isEmotionOfMood(emotion, mood))
}
