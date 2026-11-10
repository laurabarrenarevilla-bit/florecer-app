import { describe, expect, it } from 'vitest'
import { buildMonthGrid, resolveVisibleMonth } from './calendarGrid.ts'

describe('buildMonthGrid', () => {
  it('empieza en lunes y rellena los huecos (noviembre de 2026 empieza en domingo)', () => {
    const weeks = buildMonthGrid('2026-11')
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01'])
    expect(weeks[1]?.[0]).toBe('2026-11-02')
    expect(weeks.at(-1)).toEqual(['2026-11-30', null, null, null, null, null, null])
    expect(weeks).toHaveLength(6)
  })

  it('un mes que empieza en lunes no tiene huecos iniciales (junio de 2026)', () => {
    const weeks = buildMonthGrid('2026-06')
    expect(weeks[0]?.[0]).toBe('2026-06-01')
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
  })

  it('febrero de 2021 ocupa exactamente cuatro semanas', () => {
    const weeks = buildMonthGrid('2021-02')
    expect(weeks).toHaveLength(4)
    expect(weeks.flat().every(Boolean)).toBe(true)
  })

  it('F1-10: incluye el 29 de febrero en años bisiestos y no en los demás', () => {
    expect(buildMonthGrid('2028-02').flat()).toContain('2028-02-29')
    expect(buildMonthGrid('2027-02').flat()).not.toContain('2027-02-29')
  })

  it('F1-10/11: diciembre termina en el 31 y los meses con cambio de hora no pierden días', () => {
    expect(buildMonthGrid('2026-12').flat().filter(Boolean).at(-1)).toBe('2026-12-31')
    expect(buildMonthGrid('2026-03').flat().filter(Boolean)).toHaveLength(31)
    expect(buildMonthGrid('2026-10').flat().filter(Boolean)).toHaveLength(31)
    expect(buildMonthGrid('2026-03').flat()).toContain('2026-03-29')
    expect(buildMonthGrid('2026-10').flat()).toContain('2026-10-25')
  })

  it('todas las semanas tienen siete celdas', () => {
    for (const month of ['2026-01', '2026-02', '2026-08', '2027-05']) {
      expect(buildMonthGrid(month).every((week) => week.length === 7)).toBe(true)
    }
  })
})

describe('resolveVisibleMonth', () => {
  it('usa el mes de la URL si es válido y no futuro', () => {
    expect(resolveVisibleMonth('2025-12', null, '2026-11')).toBe('2025-12')
  })

  it('limita los meses futuros al mes actual', () => {
    expect(resolveVisibleMonth('2027-01', null, '2026-11')).toBe('2026-11')
  })

  it('ignora meses no válidos y usa el del día abierto o el actual', () => {
    expect(resolveVisibleMonth('2026-13', '2026-10-05', '2026-11')).toBe('2026-10')
    expect(resolveVisibleMonth('basura', null, '2026-11')).toBe('2026-11')
    expect(resolveVisibleMonth(null, null, '2026-11')).toBe('2026-11')
  })

  it('no baja del primer mes admitido', () => {
    expect(resolveVisibleMonth('1999-05', null, '2026-11')).toBe('2000-01')
  })
})
