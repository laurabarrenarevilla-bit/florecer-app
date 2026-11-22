import { describe, expect, it } from 'vitest'
import { buildEntry } from '@/test/fakeJournalRepository.ts'
import { excerpt, normalizeText, searchEntries } from './searchEntries.ts'

const entries = [
  buildEntry({ id: '00000000-0000-4000-8000-000000000001', date: '2026-11-01', mood: 'happy', reflection: 'Un día de paseo por el río.' }),
  buildEntry({ id: '00000000-0000-4000-8000-000000000002', date: '2026-11-05', mood: 'sad', emotions: ['disappointment'], achievement: 'Terminé el examen' }),
  buildEntry({ id: '00000000-0000-4000-8000-000000000003', date: '2026-11-10', mood: 'neutral', reflection: 'Año nuevo, ano no.' }),
]
const none = { text: '', mood: null, from: null, to: null }

describe('searchEntries', () => {
  it('sin filtros devuelve todo del más reciente al más antiguo', () => {
    expect(searchEntries(entries, none).map((e) => e.date)).toEqual(['2026-11-10', '2026-11-05', '2026-11-01'])
  })

  it('ignora tildes y mayúsculas, busca en reflexión, logro y emociones, y exige todas las palabras', () => {
    expect(searchEntries(entries, { ...none, text: 'DIA rio' }).map((e) => e.date)).toEqual(['2026-11-01'])
    expect(searchEntries(entries, { ...none, text: 'examen' }).map((e) => e.date)).toEqual(['2026-11-05'])
    expect(searchEntries(entries, { ...none, text: 'decepcion' }).map((e) => e.date)).toEqual(['2026-11-05'])
    expect(searchEntries(entries, { ...none, text: 'paseo examen' })).toEqual([])
  })

  it('distingue la ñ', () => {
    expect(normalizeText('Año')).toBe('año')
    expect(searchEntries(entries, { ...none, text: 'año' }).map((e) => e.date)).toEqual(['2026-11-10'])
  })

  it('filtra por ánimo y por fechas (inclusivas)', () => {
    expect(searchEntries(entries, { ...none, mood: 'sad' }).map((e) => e.date)).toEqual(['2026-11-05'])
    expect(searchEntries(entries, { ...none, from: '2026-11-05', to: '2026-11-10' }).map((e) => e.date)).toEqual(['2026-11-10', '2026-11-05'])
  })

  it('recorta textos largos alrededor de la coincidencia', () => {
    const long = `${'a'.repeat(300)} palabra ${'b'.repeat(300)}`
    const cut = excerpt(long, 'palabra')
    expect(cut).toContain('palabra')
    expect(cut.startsWith('…')).toBe(true)
    expect(cut.endsWith('…')).toBe(true)
  })
})
