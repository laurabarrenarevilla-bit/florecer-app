import { describe, expect, it } from 'vitest'
import { dateRange, effectiveEnd, formatPeriod, periodContaining, resolvePeriod, shiftPeriod } from './periods.ts'

describe('periodContaining', () => {
  it('semana de lunes a domingo, también cruzando mes y año', () => {
    expect(periodContaining('week', '2026-11-22')).toMatchObject({ from: '2026-11-16', to: '2026-11-22' })
    expect(periodContaining('week', '2026-11-16')).toMatchObject({ from: '2026-11-16', to: '2026-11-22' })
    expect(periodContaining('week', '2027-01-01')).toMatchObject({ from: '2026-12-28', to: '2027-01-03' })
  })

  it('mes completo, con febrero bisiesto', () => {
    expect(periodContaining('month', '2028-02-10')).toMatchObject({ from: '2028-02-01', to: '2028-02-29' })
    expect(periodContaining('month', '2026-02-10')).toMatchObject({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('año completo', () => {
    expect(periodContaining('year', '2026-06-15')).toMatchObject({ from: '2026-01-01', to: '2026-12-31' })
  })
})

describe('shiftPeriod', () => {
  it('va al período anterior y al siguiente del mismo tipo', () => {
    expect(shiftPeriod(periodContaining('week', '2026-11-04'), -1)).toMatchObject({ from: '2026-10-26', to: '2026-11-01' })
    expect(shiftPeriod(periodContaining('month', '2026-01-15'), -1)).toMatchObject({ from: '2025-12-01', to: '2025-12-31' })
    expect(shiftPeriod(periodContaining('month', '2026-12-15'), 1)).toMatchObject({ from: '2027-01-01' })
    expect(shiftPeriod(periodContaining('year', '2026-05-05'), -1)).toMatchObject({ from: '2025-01-01', to: '2025-12-31' })
  })

  it('la semana del cambio de hora (DST) sigue teniendo 7 días', () => {
    const week = periodContaining('week', '2026-10-25')
    expect(dateRange(week.from, week.to)).toHaveLength(7)
    expect(dateRange('2026-03-23', '2026-03-29')).toHaveLength(7)
  })
})

describe('effectiveEnd y resolvePeriod', () => {
  it('no cuenta días futuros', () => {
    expect(effectiveEnd(periodContaining('month', '2026-11-22'), '2026-11-22')).toBe('2026-11-22')
    expect(effectiveEnd(periodContaining('month', '2026-10-01'), '2026-11-22')).toBe('2026-10-31')
  })

  it('ignora fechas futuras, inválidas o anteriores al mínimo, y usa mes por defecto', () => {
    const today = '2026-11-22'
    expect(resolvePeriod(null, null, today)).toMatchObject({ kind: 'month', from: '2026-11-01' })
    expect(resolvePeriod('semana', '2027-01-01', today)).toMatchObject({ kind: 'week', from: '2026-11-16' })
    expect(resolvePeriod('año', '2026-02-30', today)).toMatchObject({ kind: 'year', from: '2026-01-01' })
    expect(resolvePeriod('mes', '1999-05-01', today)).toMatchObject({ from: '2026-11-01' })
    expect(resolvePeriod('otra', '2026-03-10', today)).toMatchObject({ kind: 'month', from: '2026-03-01' })
  })
})

describe('formatPeriod', () => {
  it('formatea en español', () => {
    expect(formatPeriod(periodContaining('month', '2026-11-22'))).toBe('noviembre de 2026')
    expect(formatPeriod(periodContaining('year', '2026-11-22'))).toBe('2026')
    expect(formatPeriod(periodContaining('week', '2026-11-22'))).toMatch(/16.*22 de noviembre de 2026/)
  })
})
