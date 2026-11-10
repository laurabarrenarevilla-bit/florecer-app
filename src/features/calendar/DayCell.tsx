import { MoodIcon } from '@/features/journal/MoodIcon.tsx'
import { MOOD_LABELS, type Mood } from '@/features/journal/mood.ts'
import { formatLongDate, parseLocalDate, type LocalDate } from '@/shared/lib/dates.ts'

interface DayCellProps {
  date: LocalDate
  mood: Mood | null
  isToday: boolean
  isFuture: boolean
  isSelected: boolean
  onSelect: (date: LocalDate) => void
}

function describeDay({ date, mood, isToday, isFuture }: Pick<DayCellProps, 'date' | 'mood' | 'isToday' | 'isFuture'>) {
  const parts = [formatLongDate(date)]
  if (isToday) parts.push('hoy')
  if (isFuture) parts.push('día futuro')
  else parts.push(mood ? MOOD_LABELS[mood] : 'sin registro')
  return parts.join(', ')
}

/** Día del calendario: color e icono de la emoción, y etiqueta completa para lectores. */
export function DayCell({ date, mood, isToday, isFuture, isSelected, onSelect }: DayCellProps) {
  const day = parseLocalDate(date)?.day ?? ''
  const classes = ['day-cell', mood ? `day-cell--${mood}` : 'day-cell--empty', isSelected ? 'day-cell--selected' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      aria-label={describeDay({ date, mood, isToday, isFuture })}
      aria-current={isToday ? 'date' : undefined}
      disabled={isFuture}
      onClick={() => onSelect(date)}
      data-date={date}
    >
      <span className="day-cell__number" aria-hidden="true">
        {day}
      </span>
      {mood && (
        <span className="day-cell__mood">
          <MoodIcon mood={mood} size={14} />
        </span>
      )}
    </button>
  )
}
