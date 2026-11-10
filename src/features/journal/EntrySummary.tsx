import { forwardRef, type ReactNode } from 'react'
import { CheckIcon } from '@/shared/ui/icons.tsx'
import { MoodIcon } from './MoodIcon.tsx'
import { MOOD_LABELS } from './mood.ts'
import type { JournalEntryContent } from './types.ts'

interface EntrySummaryProps {
  entry: JournalEntryContent
  /** Encabezado accesible del resumen (p. ej. "Tu registro de hoy"). */
  heading: string
  actions?: ReactNode
}

/** Vista de lectura de una entrada guardada. Recibe el foco tras guardar. */
export const EntrySummary = forwardRef<HTMLElement, EntrySummaryProps>(function EntrySummary(
  { entry, heading, actions },
  ref,
) {
  return (
    <article ref={ref} className="entry-summary" tabIndex={-1} aria-label={heading}>
      <div className="entry-summary__top">
        <span className={`mood-pill mood-pill--${entry.mood}`}>
          <MoodIcon mood={entry.mood} size={18} />
          {MOOD_LABELS[entry.mood]}
        </span>
        {actions && <div className="entry-summary__actions">{actions}</div>}
      </div>

      {entry.reflection ? (
        <p className="entry-summary__reflection">{entry.reflection}</p>
      ) : (
        <p className="entry-summary__empty">Sin reflexión escrita.</p>
      )}

      {entry.achievement && (
        <div className="entry-summary__achievement">
          <span className="entry-summary__check" aria-hidden="true">
            <CheckIcon size={12} />
          </span>
          <p>
            <span className="visually-hidden">Logro: </span>
            {entry.achievement}
          </p>
        </div>
      )}
    </article>
  )
})
