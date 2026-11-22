import {
  addCalendarDays,
  compareLocalDates,
  isValidLocalDate,
  localDateToDate,
  monthBounds,
  monthKeyOf,
  weekdayMondayFirst,
  type LocalDate,
} from '@/shared/lib/dates.ts'

/** Períodos de Evolución (docs/13, ADR-011). */
export const PERIOD_KINDS = ['week', 'month', 'year'] as const
export type PeriodKind = (typeof PERIOD_KINDS)[number]

export const PERIOD_LABELS: Record<PeriodKind, string> = { week: 'Semana', month: 'Mes', year: 'Año' }

/** Valores de ?vista= en la URL (en español, legibles). */
const KIND_PARAMS: Record<PeriodKind, string> = { week: 'semana', month: 'mes', year: 'año' }

export const MIN_PERIOD_DATE: LocalDate = '2000-01-01'

export interface Period {
  kind: PeriodKind
  /** Primer día del período. */
  from: LocalDate
  /** Último día del período completo (puede ser futuro). */
  to: LocalDate
}

export function periodContaining(kind: PeriodKind, date: LocalDate): Period {
  if (kind === 'week') {
    const from = addCalendarDays(date, -weekdayMondayFirst(date))
    return { kind, from, to: addCalendarDays(from, 6) }
  }
  if (kind === 'month') {
    const { from, to } = monthBounds(monthKeyOf(date))
    return { kind, from, to }
  }
  const year = date.slice(0, 4)
  return { kind, from: `${year}-01-01`, to: `${year}-12-31` }
}

/** El período anterior (amount = -1) o siguiente (amount = 1) del mismo tipo. */
export function shiftPeriod(period: Period, amount: -1 | 1): Period {
  const pivot = amount === -1 ? addCalendarDays(period.from, -1) : addCalendarDays(period.to, 1)
  return periodContaining(period.kind, pivot)
}

/** Último día que cuenta: el final del período o hoy, lo que llegue antes. */
export function effectiveEnd(period: Period, today: LocalDate): LocalDate {
  return compareLocalDates(period.to, today) > 0 ? today : period.to
}

export function containsDate(period: Period, date: LocalDate): boolean {
  return compareLocalDates(date, period.from) >= 0 && compareLocalDates(date, period.to) <= 0
}

/** Días civiles de from a to, ambos incluidos. */
export function dateRange(from: LocalDate, to: LocalDate): LocalDate[] {
  const days: LocalDate[] = []
  for (let day = from; compareLocalDates(day, to) <= 0; day = addCalendarDays(day, 1)) days.push(day)
  return days
}

export function parseKindParam(value: string | null): PeriodKind {
  const match = PERIOD_KINDS.find((kind) => KIND_PARAMS[kind] === value)
  return match ?? 'month'
}

export function kindParam(kind: PeriodKind): string {
  return KIND_PARAMS[kind]
}

/** Período a mostrar según la URL: fecha válida, no futura y no anterior al mínimo. */
export function resolvePeriod(kindValue: string | null, dateValue: string | null, today: LocalDate): Period {
  const kind = parseKindParam(kindValue)
  const valid =
    dateValue !== null &&
    isValidLocalDate(dateValue) &&
    compareLocalDates(dateValue, MIN_PERIOD_DATE) >= 0 &&
    compareLocalDates(dateValue, today) <= 0
  return periodContaining(kind, valid ? dateValue : today)
}

const dayMonthYear = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
const monthYear = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

/** "16–22 de noviembre de 2026", "noviembre de 2026" o "2026". */
export function formatPeriod(period: Period): string {
  if (period.kind === 'year') return period.from.slice(0, 4)
  if (period.kind === 'month') return monthYear.format(localDateToDate(period.from))
  return dayMonthYear.formatRange(localDateToDate(period.from), localDateToDate(period.to))
}

/** Nombre corto del período para frases: "esta semana", "el mes anterior"… */
export function relativePeriodName(kind: PeriodKind, which: 'current' | 'previous'): string {
  const names: Record<PeriodKind, [string, string]> = {
    week: ['esta semana', 'la semana anterior'],
    month: ['este mes', 'el mes anterior'],
    year: ['este año', 'el año anterior'],
  }
  return names[kind][which === 'current' ? 0 : 1]
}

/** Meses (1-12) de un año, para la vista anual. */
export function monthsOfYear(year: number): { month: number; from: LocalDate; to: LocalDate }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const { from, to } = monthBounds(`${year}-${String(i + 1).padStart(2, '0')}`)
    return { month: i + 1, from, to }
  })
}

export function yearOf(date: LocalDate): number {
  return Number(date.slice(0, 4))
}
