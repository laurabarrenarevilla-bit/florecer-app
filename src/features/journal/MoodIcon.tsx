import type { Mood } from './mood.ts'

const MOUTHS: Record<Mood, string> = {
  happy: 'M8 14.5 Q12 18 16 14.5',
  neutral: 'M8 15 L16 15',
  sad: 'M8 16 Q12 12.5 16 16',
}

/** Cara de la emoción; usa currentColor para heredar la tinta del contenedor. */
export function MoodIcon({ mood, size = 32 }: { mood: Mood; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" />
      <path d={MOUTHS[mood]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
