import { MoodIcon } from '@/features/journal/MoodIcon.tsx'
import { MOOD_LABELS, MOODS } from '@/features/journal/mood.ts'

export function MoodLegend() {
  return (
    <ul className="mood-legend" aria-label="Leyenda de colores">
      {MOODS.map((mood) => (
        <li key={mood} className="mood-legend__item">
          <span className={`mood-legend__swatch mood-legend__swatch--${mood}`} aria-hidden="true">
            <MoodIcon mood={mood} size={16} />
          </span>
          {MOOD_LABELS[mood]}
        </li>
      ))}
      <li className="mood-legend__item">
        <span className="mood-legend__swatch mood-legend__swatch--empty" aria-hidden="true" />
        Sin registro
      </li>
    </ul>
  )
}
