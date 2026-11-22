import { describe, expect, it } from 'vitest'
import type { JournalEntry } from '@/features/journal/types.ts'
import { buildEntry } from '@/test/fakeJournalRepository.ts'
import { describePatterns, longestStreak, summarize } from './stats.ts'

const entry = (date: string, mood: JournalEntry['mood'], extra: Partial<JournalEntry> = {}) => buildEntry({ date, mood, ...extra })

describe('summarize', () => {
  it('cuenta ánimos sobre días registrados, emociones sobre días con emociones y logros', () => {
    const summary = summarize(
      [
        entry('2026-11-02', 'happy', { emotions: ['love', 'trust'], achievement: 'logro sintético' }),
        entry('2026-11-03', 'happy', { emotions: ['love'] }),
        entry('2026-11-05', 'sad', { emotions: ['anger'] }),
        entry('2026-11-06', 'neutral'),
      ],
      22,
    )
    expect(summary.registeredDays).toBe(4)
    expect(summary.elapsedDays).toBe(22)
    expect(summary.moods).toEqual([
      { mood: 'happy', count: 2, percentage: 50 },
      { mood: 'neutral', count: 1, percentage: 25 },
      { mood: 'sad', count: 1, percentage: 25 },
    ])
    expect(summary.entriesWithEmotions).toBe(3)
    // Frecuencia descendente y desempate alfabético por etiqueta en español.
    // «Confianza» va antes que «Enfado».
    expect(summary.emotions.map((e) => [e.emotion, e.count])).toEqual([
      ['love', 2],
      ['trust', 1],
      ['anger', 1],
    ])
    expect(summary.emotions[0]?.percentage).toBeCloseTo(66.67, 1)
    expect(summary.achievementDays).toBe(1)
    expect(summary.longestStreak).toBe(2)
  })

  it('sin registros no inventa porcentajes', () => {
    const summary = summarize([], 7)
    expect(summary.registeredDays).toBe(0)
    expect(summary.moods.every((m) => m.count === 0 && m.percentage === 0)).toBe(true)
    expect(summary.emotions).toEqual([])
  })

  it('un logro solo con espacios no cuenta', () => {
    expect(summarize([entry('2026-11-02', 'happy', { achievement: '   ' })], 1).achievementDays).toBe(0)
  })
})

describe('longestStreak', () => {
  it('usa fechas civiles: cruza meses, años y el cambio de hora', () => {
    expect(longestStreak([])).toBe(0)
    expect(longestStreak(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-03'])).toBe(3)
    expect(longestStreak(['2026-10-24', '2026-10-25', '2026-10-26'])).toBe(3)
    expect(longestStreak(['2028-02-28', '2028-02-29', '2028-03-01'])).toBe(3)
  })
})

describe('describePatterns', () => {
  const fourWeeks = [
    // Lunes 2, 9, 16 y 23 de noviembre: tres tristes y uno feliz.
    entry('2026-11-02', 'sad', { emotions: ['anger'] }),
    entry('2026-11-09', 'sad', { emotions: ['anger'] }),
    entry('2026-11-16', 'sad', { emotions: ['fear'] }),
    entry('2026-11-23', 'happy'),
    entry('2026-11-10', 'happy', { achievement: 'logro sintético' }),
    entry('2026-11-11', 'happy'),
  ]

  it('con menos de 5 días no muestra patrones', () => {
    const few = fourWeeks.slice(0, 4)
    expect(describePatterns(few, summarize(few, 30))).toEqual([])
  })

  it('describe el ánimo más frecuente, emociones, días de la semana, racha y logros', () => {
    const patterns = describePatterns(fourWeeks, summarize(fourWeeks, 30))
    expect(patterns).toContain('Registraste «Feliz» y «Triste» el mismo número de días: 3 de 6 cada uno.')
    expect(patterns).toContain('La emoción concreta que más marcaste fue «Enfado»: 2 días.')
    expect(patterns).toContain('Los lunes registraste sobre todo «Triste»: 3 de 4.')
    expect(patterns).toContain('Tu racha más larga fue de 3 días seguidos con registro.')
    expect(patterns).toContain('Apuntaste un logro en 1 de 6 días.')
  })

  it('no valora ni diagnostica', () => {
    const text = describePatterns(fourWeeks, summarize(fourWeeks, 30)).join(' ').toLowerCase()
    for (const word of ['mejor', 'peor', 'mejora', 'empeora', 'depres', 'ansiedad', 'trastorno', 'deberías']) {
      expect(text).not.toContain(word)
    }
  })
})
