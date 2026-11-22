import { describe, expect, it } from 'vitest'
import { buildEntry } from '@/test/fakeJournalRepository.ts'
import { frequentWords } from './words.ts'

const entry = (date: string, reflection: string) => buildEntry({ date, reflection })

describe('frequentWords', () => {
  it('cuenta palabras reales, quita palabras vacías y números, e ignora tildes al contar', () => {
    const words = frequentWords([
      entry('2026-11-01', 'Hoy fue un día de trabajo y paseo por el río.'),
      entry('2026-11-02', 'Más trabajo, pero el paseo me sentó bien. 2026'),
      entry('2026-11-03', 'Trabajo otra vez. Rio con mis amigas; el río estaba precioso.'),
    ])
    expect(words).toEqual([
      { word: 'trabajo', count: 3 },
      { word: 'paseo', count: 2 },
      { word: 'río', count: 3 },
    ].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'es')))
    expect(words.map((w) => w.word)).not.toContain('día')
    expect(words.map((w) => w.word)).not.toContain('pero')
  })

  it('con menos de 3 reflexiones no muestra nada', () => {
    expect(frequentWords([entry('2026-11-01', 'paseo paseo paseo'), entry('2026-11-02', 'paseo')])).toEqual([])
  })

  it('solo palabras que se repiten', () => {
    expect(frequentWords([entry('2026-11-01', 'uno'), entry('2026-11-02', 'gato'), entry('2026-11-03', 'perro')])).toEqual([])
  })

  it('respeta la ñ', () => {
    const words = frequentWords([entry('2026-11-01', 'año'), entry('2026-11-02', 'año'), entry('2026-11-03', 'ano')])
    expect(words).toEqual([{ word: 'año', count: 2 }])
  })
})
