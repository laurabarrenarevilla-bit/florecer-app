import type { JournalEntry } from '@/features/journal/types.ts'
import { formatMonthYear, isFutureDate, type LocalDate, type MonthKey } from '@/shared/lib/dates.ts'
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/icons.tsx'
import { buildMonthGrid, WEEKDAYS } from './calendarGrid.ts'
import { DayCell } from './DayCell.tsx'

interface MonthCalendarProps {
  month: MonthKey
  today: LocalDate
  entries: ReadonlyMap<LocalDate, JournalEntry>
  selectedDay: LocalDate | null
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  onSelectDay: (date: LocalDate) => void
}

export function MonthCalendar({
  month,
  today,
  entries,
  selectedDay,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onSelectDay,
}: MonthCalendarProps) {
  const weeks = buildMonthGrid(month)
  const monthLabel = formatMonthYear(month)

  return (
    <div className="calendar card">
      <div className="calendar__header">
        <button
          type="button"
          className="calendar__nav"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon />
        </button>
        <h2 className="calendar__title" aria-live="polite">
          {monthLabel}
        </h2>
        <button type="button" className="calendar__nav" onClick={onNext} disabled={!canGoNext} aria-label="Mes siguiente">
          <ChevronRightIcon />
        </button>
      </div>

      <table className="calendar__grid">
        <caption className="visually-hidden">Registros de {monthLabel}</caption>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday.long} scope="col" className="calendar__weekday">
                <abbr title={weekday.long}>{weekday.short}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={week.find(Boolean) ?? weekIndex}>
              {week.map((date, dayIndex) => (
                <td key={date ?? `vacio-${weekIndex}-${dayIndex}`} className="calendar__cell">
                  {date && (
                    <DayCell
                      date={date}
                      mood={entries.get(date)?.mood ?? null}
                      isToday={date === today}
                      isFuture={isFutureDate(date, today)}
                      isSelected={date === selectedDay}
                      onSelect={onSelectDay}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
