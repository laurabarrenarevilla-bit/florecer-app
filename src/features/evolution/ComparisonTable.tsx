import { MOOD_LABELS } from '@/features/journal/mood.ts'
import { formatPercentage, type PeriodSummary } from './stats.ts'

interface ComparisonTableProps {
  /** Nombre visible de cada período ("noviembre de 2026"). */
  currentLabel: string
  previousLabel: string
  current: PeriodSummary
  /** null mientras carga o si no se pudo leer el período anterior. */
  previous: PeriodSummary | null
  previousStatus: 'loading' | 'error' | 'ready'
}

function cell(count: number, total: number) {
  return total > 0 ? `${count} · ${formatPercentage((count / total) * 100)}` : String(count)
}

/**
 * Comparación con el período anterior: solo cantidades y porcentajes, sin
 * flechas ni palabras como "mejor" o "peor" (docs/13).
 */
export function ComparisonTable({ currentLabel: currentName, previousLabel: previousName, current, previous, previousStatus }: ComparisonTableProps) {
  const fallback = previousStatus === 'loading' ? '…' : '—'

  const rows: { label: string; current: string; previous: string }[] = [
    {
      label: 'Días registrados',
      current: `${current.registeredDays} de ${current.elapsedDays}`,
      previous: previous ? `${previous.registeredDays} de ${previous.elapsedDays}` : fallback,
    },
    ...current.moods.map((m, i) => {
      const prev = previous?.moods[i]
      return {
        label: MOOD_LABELS[m.mood],
        current: cell(m.count, current.registeredDays),
        previous: previous && prev ? cell(prev.count, previous.registeredDays) : fallback,
      }
    }),
    {
      label: 'Días con logro',
      current: cell(current.achievementDays, current.registeredDays),
      previous: previous ? cell(previous.achievementDays, previous.registeredDays) : fallback,
    },
  ]

  return (
    <div className="comparison">
      <table className="comparison__table">
        <caption className="visually-hidden">
          Comparación entre {currentName} y {previousName}
        </caption>
        <thead>
          <tr>
            <td />
            <th scope="col">{currentName}</th>
            <th scope="col">{previousName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.current}</td>
              <td>{row.previous}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {previousStatus === 'error' && (
        <p className="comparison__note">No hemos podido cargar el período anterior ({previousName}). Los datos de {currentName} son correctos.</p>
      )}
      <p className="comparison__note">Los porcentajes se calculan sobre los días registrados y se redondean.</p>
    </div>
  )
}
