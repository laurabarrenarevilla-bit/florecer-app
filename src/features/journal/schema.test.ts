import { describe, expect, it } from 'vitest'
import { entryContentSchema, journalEntryRowSchema, notFutureDateSchema } from './schema.ts'

describe('entryContentSchema', () => {
  it('exige una emoción válida', () => {
    expect(entryContentSchema.safeParse({ mood: undefined, reflection: '', achievement: '' }).success).toBe(false)
    expect(entryContentSchema.safeParse({ mood: 'feliz', reflection: '', achievement: '' }).success).toBe(false)
  })

  it('acepta solo la emoción, con texto y logro vacíos', () => {
    const result = entryContentSchema.safeParse({ mood: 'happy', reflection: '', achievement: '' })
    expect(result.success).toBe(true)
  })

  it('recorta los extremos y conserva saltos de línea internos', () => {
    const result = entryContentSchema.parse({ mood: 'sad', reflection: '  línea 1\nlínea 2  \n', achievement: ' logro ' })
    expect(result.reflection).toBe('línea 1\nlínea 2')
    expect(result.achievement).toBe('logro')
  })

  it('limita la longitud de reflexión y logro', () => {
    expect(entryContentSchema.safeParse({ mood: 'neutral', reflection: 'a'.repeat(5000), achievement: '' }).success).toBe(true)
    expect(entryContentSchema.safeParse({ mood: 'neutral', reflection: 'a'.repeat(5001), achievement: '' }).success).toBe(false)
    expect(entryContentSchema.safeParse({ mood: 'neutral', reflection: '', achievement: 'a'.repeat(501) }).success).toBe(false)
  })
})

describe('notFutureDateSchema', () => {
  it('permite hoy y fechas pasadas, rechaza futuras e inválidas', () => {
    const schema = notFutureDateSchema('2026-11-09')
    expect(schema.safeParse('2026-11-09').success).toBe(true)
    expect(schema.safeParse('2025-01-01').success).toBe(true)
    expect(schema.safeParse('2026-11-10').success).toBe(false)
    expect(schema.safeParse('2026-02-30').success).toBe(false)
  })
})

describe('journalEntryRowSchema', () => {
  it('adapta snake_case a camelCase', () => {
    const entry = journalEntryRowSchema.parse({
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      entry_date: '2026-11-09',
      mood: 'happy',
      reflection: 'texto de prueba',
      achievement: '',
      created_at: '2026-11-09T10:00:00.000000+00:00',
      updated_at: '2026-11-09T10:00:00.000000+00:00',
    })
    expect(entry).toMatchObject({ userId: '550e8400-e29b-41d4-a716-446655440000', date: '2026-11-09', mood: 'happy' })
  })

  it('rechaza filas con mood desconocido', () => {
    const result = journalEntryRowSchema.safeParse({
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      entry_date: '2026-11-09',
      mood: 'feliz',
      reflection: '',
      achievement: '',
      created_at: 'x',
      updated_at: 'x',
    })
    expect(result.success).toBe(false)
  })
})
