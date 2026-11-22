import { Link } from 'react-router'
import type { JournalEntry } from '@/features/journal/types.ts'
import { formatLongDate, monthKeyOf } from '@/shared/lib/dates.ts'
import { CheckIcon } from '@/shared/ui/icons.tsx'

/** Máximo de logros visibles: en la vista anual la lista podría ser muy larga. */
export const MAX_VISIBLE_ACHIEVEMENTS = 10

/** Logros del período, del más reciente al más antiguo, con enlace a su día. */
export function AchievementList({ entries }: { entries: readonly JournalEntry[] }) {
  const withAchievement = entries.filter((e) => e.achievement.trim() !== '').sort((a, b) => b.date.localeCompare(a.date))
  if (withAchievement.length === 0) {
    return <p className="evolution__muted">En este período no apuntaste logros. Todos cuentan, también los pequeños.</p>
  }
  const visible = withAchievement.slice(0, MAX_VISIBLE_ACHIEVEMENTS)
  return (
    <>
      <ul className="achievement-list">
        {visible.map((entry) => (
          <li key={entry.date} className="achievement-list__item">
            <span className="achievement-list__check" aria-hidden="true">
              <CheckIcon size={12} />
            </span>
            <div>
              <p className="achievement-list__text">{entry.achievement}</p>
              <Link className="achievement-list__date" to={`/calendario?mes=${monthKeyOf(entry.date)}&dia=${entry.date}`}>
                {formatLongDate(entry.date, { withYear: true })}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {withAchievement.length > visible.length && (
        <p className="evolution__muted">
          Se muestran los {visible.length} más recientes de {withAchievement.length}. Elige un período más corto para ver el resto.
        </p>
      )}
    </>
  )
}
