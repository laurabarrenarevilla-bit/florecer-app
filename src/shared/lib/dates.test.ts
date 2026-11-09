import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  addMonths,
  compareLocalDates,
  formatLongDate,
  formatMonthYear,
  isFutureDate,
  isValidLocalDate,
  monthBounds,
  msUntilNextLocalMidnight,
  parseLocalDate,
  todayLocal,
  weekdayMondayFirst,
} from './dates.ts'

describe('entorno de pruebas', () => {
  it('se ejecuta en Europe/Madrid', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Madrid')
  })
})

describe('parseLocalDate / isValidLocalDate', () => {
  it('acepta fechas reales', () => {
    expect(parseLocalDate('2026-11-09')).toEqual({ year: 2026, month: 11, day: 9 })
    expect(isValidLocalDate('2028-02-29')).toBe(true)
    expect(isValidLocalDate('2026-12-31')).toBe(true)
  })

  it('rechaza fechas inexistentes o mal formadas', () => {
    expect(isValidLocalDate('2026-02-29')).toBe(false)
    expect(isValidLocalDate('2026-02-31')).toBe(false)
    expect(isValidLocalDate('2026-13-01')).toBe(false)
    expect(isValidLocalDate('2026-00-10')).toBe(false)
    expect(isValidLocalDate('2026-1-1')).toBe(false)
    expect(isValidLocalDate('2026-11-09T00:00:00Z')).toBe(false)
    expect(isValidLocalDate('')).toBe(false)
  })
})

describe('todayLocal', () => {
  it('usa la fecha local y no la UTC cerca de medianoche', () => {
    // 23:30 UTC del 9 de noviembre = 00:30 del 10 en Madrid (UTC+1).
    expect(todayLocal(new Date('2026-11-09T23:30:00Z'))).toBe('2026-11-10')
    // 22:59 UTC = 23:59 en Madrid: sigue siendo día 9.
    expect(todayLocal(new Date('2026-11-09T22:59:00Z'))).toBe('2026-11-09')
  })

  it('respeta el horario de verano (UTC+2)', () => {
    // 22:30 UTC del 30 de junio = 00:30 del 1 de julio en Madrid.
    expect(todayLocal(new Date('2026-06-30T22:30:00Z'))).toBe('2026-07-01')
  })
})

describe('addCalendarDays', () => {
  it('cruza meses, años y años bisiestos', () => {
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addCalendarDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addCalendarDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addCalendarDays('2026-01-31', 30)).toBe('2026-03-02')
  })

  it('no se desplaza en los cambios de hora de Europe/Madrid', () => {
    // 29-03-2026: el día dura 23 horas. 25-10-2026: dura 25 horas.
    expect(addCalendarDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addCalendarDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addCalendarDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addCalendarDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addCalendarDays('2026-10-26', -2)).toBe('2026-10-24')
  })
})

describe('comparaciones', () => {
  it('compara y detecta fechas futuras', () => {
    expect(compareLocalDates('2026-11-09', '2026-11-10')).toBe(-1)
    expect(compareLocalDates('2026-11-10', '2026-11-10')).toBe(0)
    expect(isFutureDate('2026-11-10', '2026-11-09')).toBe(true)
    expect(isFutureDate('2026-11-09', '2026-11-09')).toBe(false)
    expect(isFutureDate('2025-12-31', '2026-01-01')).toBe(false)
  })

  it('calcula el día de la semana empezando en lunes', () => {
    expect(weekdayMondayFirst('2026-11-09')).toBe(0) // lunes
    expect(weekdayMondayFirst('2026-11-15')).toBe(6) // domingo
    expect(weekdayMondayFirst('2026-03-29')).toBe(6) // domingo con cambio de hora
  })
})

describe('meses', () => {
  it('suma meses cruzando años', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-11', -23)).toBe('2024-12')
  })

  it('calcula los límites de cada mes', () => {
    expect(monthBounds('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(monthBounds('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
    expect(monthBounds('2026-12')).toEqual({ from: '2026-12-01', to: '2026-12-31' })
  })
})

describe('formato en español', () => {
  it('formatea fechas largas y meses', () => {
    expect(formatLongDate('2026-11-09')).toBe('lunes, 9 de noviembre')
    expect(formatLongDate('2026-11-09', { withYear: true })).toBe('lunes, 9 de noviembre de 2026')
    expect(formatMonthYear('2026-11')).toBe('noviembre de 2026')
  })
})

describe('msUntilNextLocalMidnight', () => {
  it('calcula el tiempo hasta la siguiente medianoche local', () => {
    const now = new Date(2026, 10, 9, 23, 59, 0)
    expect(msUntilNextLocalMidnight(now)).toBe(61_000)
  })
})
