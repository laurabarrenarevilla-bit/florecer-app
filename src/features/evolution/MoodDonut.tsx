import { useId } from 'react'
import { MoodIcon } from '@/features/journal/MoodIcon.tsx'
import { MOOD_LABELS } from '@/features/journal/mood.ts'
import { formatPercentage, type MoodShare } from './stats.ts'

interface MoodDonutProps {
  moods: readonly MoodShare[]
  registeredDays: number
}

// Radio con circunferencia 100: cada porcentaje es directamente la longitud del arco.
const RADIUS = 100 / (2 * Math.PI)

/**
 * Gráfico de anillo ("quesito") con la proporción de cada ánimo sobre los
 * días registrados. Los mismos datos aparecen en texto en la leyenda: el
 * gráfico nunca es la única forma de leerlos.
 */
export function MoodDonut({ moods, registeredDays }: MoodDonutProps) {
  const titleId = useId()
  const visible = moods.filter((m) => m.count > 0)
  // Inicio de cada porción: suma de las anteriores.
  const starts = visible.map((_, i) => visible.slice(0, i).reduce((sum, m) => sum + m.percentage, 0))

  return (
    <div className="mood-donut">
      <svg className="mood-donut__chart" viewBox="0 0 42 42" role="img" aria-labelledby={titleId}>
        <title id={titleId}>
          {`Reparto de ánimos en ${registeredDays} días registrados: ${moods
            .map((m) => `${MOOD_LABELS[m.mood]} ${m.count}`)
            .join(', ')}.`}
        </title>
        <circle className="mood-donut__track" cx="21" cy="21" r={RADIUS} />
        {visible.map((m, i) => {
          // Pequeño hueco entre porciones salvo si solo hay una.
          const gap = visible.length > 1 ? 0.6 : 0
          const length = Math.max(m.percentage - gap, 0.1)
          return (
            <circle
              key={m.mood}
              className={`mood-donut__segment mood-donut__segment--${m.mood}`}
              cx="21"
              cy="21"
              r={RADIUS}
              strokeDasharray={`${length} ${100 - length}`}
              // Empieza arriba (25) y avanza en sentido horario.
              strokeDashoffset={25 - (starts[i] ?? 0)}
            />
          )
        })}
        <text className="mood-donut__total" x="21" y="21" aria-hidden="true">
          {registeredDays}
        </text>
        <text className="mood-donut__caption" x="21" y="26.5" aria-hidden="true">
          {registeredDays === 1 ? 'día' : 'días'}
        </text>
      </svg>

      <ul className="mood-donut__legend" aria-label="Días por ánimo">
        {moods.map((m) => (
          <li key={m.mood} className="mood-donut__item">
            <span className={`mood-donut__swatch mood-donut__swatch--${m.mood}`} aria-hidden="true">
              <MoodIcon mood={m.mood} size={16} />
            </span>
            <span className="mood-donut__label">{MOOD_LABELS[m.mood]}</span>
            <span className="mood-donut__value">
              {m.count} {m.count === 1 ? 'día' : 'días'}
              {registeredDays > 0 && <span className="mood-donut__share"> · {formatPercentage(m.percentage)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
