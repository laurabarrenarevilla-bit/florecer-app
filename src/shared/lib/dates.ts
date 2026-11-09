/**
 * Utilidades de fecha civil local. Única fuente de lógica de fechas del proyecto.
 *
 * - Una LocalDate es un string 'YYYY-MM-DD' que representa un día del
 *   calendario de la persona, sin hora ni zona horaria.
 * - Nunca usar `toISOString().slice(0, 10)` ni `new Date('YYYY-MM-DD')`: ambos
 *   interpretan UTC y pueden desplazar el día.
 * - La aritmética de días se hace con componentes de calendario (año, mes, día),
 *   nunca sumando milisegundos, para que los cambios de hora (DST) no afecten.
 */

/** 'YYYY-MM-DD' validada con isValidLocalDate. */
export type LocalDate = string
/** 'YYYY-MM' */
export type MonthKey = string

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_KEY_RE = /^(\d{4})-(\d{2})$/

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function daysInMonth(year: number, month: number): number {
  // month 1-12; el día 0 del mes siguiente es el último del actual.
  return new Date(year, month, 0).getDate()
}

export interface DateParts {
  year: number
  month: number // 1-12
  day: number
}

/** Devuelve las partes si la cadena es una fecha real 'YYYY-MM-DD'; si no, null. */
export function parseLocalDate(value: string): DateParts | null {
  const match = LOCAL_DATE_RE.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12 || day < 1) return null
  if (day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function isValidLocalDate(value: string): boolean {
  return parseLocalDate(value) !== null
}

export function toLocalDate({ year, month, day }: DateParts): LocalDate {
  return `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`
}

/** Fecha civil local de un instante, según la zona horaria del dispositivo. */
export function formatLocalDate(date: Date): LocalDate {
  return toLocalDate({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() })
}

export function todayLocal(now: Date = new Date()): LocalDate {
  return formatLocalDate(now)
}

function requireParts(value: LocalDate): DateParts {
  const parts = parseLocalDate(value)
  if (!parts) throw new RangeError(`Fecha no válida: ${value}`)
  return parts
}

/**
 * Convierte una fecha civil en un Date a mediodía local. El mediodía evita
 * problemas en zonas donde la medianoche no existe por el cambio de hora.
 * Solo para formatear; no para almacenar.
 */
export function localDateToDate(value: LocalDate): Date {
  const { year, month, day } = requireParts(value)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function addCalendarDays(value: LocalDate, amount: number): LocalDate {
  const { year, month, day } = requireParts(value)
  const date = new Date(year, month - 1, day + amount, 12, 0, 0, 0)
  return formatLocalDate(date)
}

/** -1, 0 o 1. El formato YYYY-MM-DD permite comparar como texto. */
export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function isFutureDate(value: LocalDate, today: LocalDate = todayLocal()): boolean {
  return compareLocalDates(value, today) > 0
}

/** Lunes = 0 … domingo = 6. */
export function weekdayMondayFirst(value: LocalDate): number {
  return (localDateToDate(value).getDay() + 6) % 7
}

// --- Meses -------------------------------------------------------------------

export function parseMonthKey(value: string): { year: number; month: number } | null {
  const match = MONTH_KEY_RE.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (year < 1 || month < 1 || month > 12) return null
  return { year, month }
}

export function toMonthKey(year: number, month: number): MonthKey {
  return `${String(year).padStart(4, '0')}-${pad2(month)}`
}

export function monthKeyOf(value: LocalDate): MonthKey {
  return value.slice(0, 7)
}

export function addMonths(key: MonthKey, amount: number): MonthKey {
  const parsed = parseMonthKey(key)
  if (!parsed) throw new RangeError(`Mes no válido: ${key}`)
  const index = parsed.year * 12 + (parsed.month - 1) + amount
  return toMonthKey(Math.floor(index / 12), (index % 12) + 1)
}

export function monthBounds(key: MonthKey): { from: LocalDate; to: LocalDate } {
  const parsed = parseMonthKey(key)
  if (!parsed) throw new RangeError(`Mes no válido: ${key}`)
  return {
    from: toLocalDate({ year: parsed.year, month: parsed.month, day: 1 }),
    to: toLocalDate({ year: parsed.year, month: parsed.month, day: daysInMonth(parsed.year, parsed.month) }),
  }
}

export function daysInMonthKey(key: MonthKey): number {
  const parsed = parseMonthKey(key)
  if (!parsed) throw new RangeError(`Mes no válido: ${key}`)
  return daysInMonth(parsed.year, parsed.month)
}

// --- Formato en español de España --------------------------------------------

const longDateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const longDateWithYearFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const monthYearFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

/** "lunes, 9 de noviembre" (añade el año si se pide). */
export function formatLongDate(value: LocalDate, options: { withYear?: boolean } = {}): string {
  const formatter = options.withYear ? longDateWithYearFormatter : longDateFormatter
  return formatter.format(localDateToDate(value))
}

/** "noviembre de 2026" */
export function formatMonthYear(key: MonthKey): string {
  const { from } = monthBounds(key)
  return monthYearFormatter.format(localDateToDate(from))
}

/** Milisegundos hasta la próxima medianoche local (mínimo 1 s). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0)
  return Math.max(1000, next.getTime() - now.getTime())
}
