import {
  addCalendarDays,
  daysInMonthKey,
  monthBounds,
  monthKeyOf,
  parseMonthKey,
  weekdayMondayFirst,
  type LocalDate,
  type MonthKey,
} from '@/shared/lib/dates.ts'

/** Primera fecha admitida por la base de datos (constraint journal_entries_date_min). */
export const MIN_DATE: LocalDate = '2000-01-01'
export const MIN_MONTH: MonthKey = monthKeyOf(MIN_DATE)

export const WEEKDAYS = [
  { short: 'L', long: 'lunes' },
  { short: 'M', long: 'martes' },
  { short: 'X', long: 'miércoles' },
  { short: 'J', long: 'jueves' },
  { short: 'V', long: 'viernes' },
  { short: 'S', long: 'sábado' },
  { short: 'D', long: 'domingo' },
] as const

/** Semanas de lunes a domingo; null en los huecos antes del día 1 y tras el último. */
export type CalendarWeek = (LocalDate | null)[]

export function buildMonthGrid(month: MonthKey): CalendarWeek[] {
  const { from } = monthBounds(month)
  const total = daysInMonthKey(month)
  const cells: (LocalDate | null)[] = Array.from({ length: weekdayMondayFirst(from) }, () => null)
  for (let offset = 0; offset < total; offset += 1) cells.push(addCalendarDays(from, offset))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: CalendarWeek[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/**
 * Mes visible a partir de la URL: válido, no anterior al mínimo y nunca
 * posterior al mes actual. Si no hay mes, se usa el del día abierto o el actual.
 */
export function resolveVisibleMonth(rawMonth: string | null, day: LocalDate | null, currentMonth: MonthKey): MonthKey {
  const candidate = rawMonth && parseMonthKey(rawMonth) ? rawMonth : day ? monthKeyOf(day) : currentMonth
  if (candidate > currentMonth) return currentMonth
  if (candidate < MIN_MONTH) return MIN_MONTH
  return candidate
}
