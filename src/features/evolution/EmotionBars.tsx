import type { CSSProperties } from 'react'
import { EMOTION_LABELS } from '@/features/journal/emotions.ts'
import { formatPercentage, type EmotionShare } from './stats.ts'

interface EmotionBarsProps {
  emotions: readonly EmotionShare[]
  entriesWithEmotions: number
}

/** Emociones secundarias más marcadas del período, con su denominador explícito. */
export function EmotionBars({ emotions, entriesWithEmotions }: EmotionBarsProps) {
  if (emotions.length === 0) {
    return (
      <p className="evolution__muted">
        En este período no marcaste emociones concretas. Puedes hacerlo al registrar el día, después de elegir el ánimo.
      </p>
    )
  }
  const max = Math.max(...emotions.map((e) => e.count))
  return (
    <>
      <ul className="emotion-bars">
        {emotions.map((e) => (
          <li key={e.emotion} className="emotion-bars__item">
            <span className="emotion-bars__label">{EMOTION_LABELS[e.emotion]}</span>
            <span className="emotion-bars__track" aria-hidden="true">
              <span
                className={`emotion-bars__fill emotion-bars__fill--${e.mood}`}
                style={{ '--share': `${(e.count / max) * 100}%` } as CSSProperties}
              />
            </span>
            <span className="emotion-bars__value">
              {e.count} {e.count === 1 ? 'día' : 'días'}
              <span className="visually-hidden">, {formatPercentage(e.percentage)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="evolution__muted">
        Sobre {entriesWithEmotions} {entriesWithEmotions === 1 ? 'día' : 'días'} con emociones marcadas. Un día puede tener
        varias.
      </p>
    </>
  )
}
