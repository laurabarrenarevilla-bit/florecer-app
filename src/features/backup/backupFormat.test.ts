import { describe, expect, it } from 'vitest'
import { buildEntry } from '@/test/fakeJournalRepository.ts'
import { MAX_BACKUP_BYTES, backupFileName, buildBackup, parseBackupText, previewImport } from './backupFormat.ts'

const TODAY = '2026-11-22'

describe('buildBackup', () => {
  it('exporta solo lo escrito, ordenado por fecha, sin ids, user_id ni marcas internas', () => {
    const backup = buildBackup(
      [
        buildEntry({ date: '2026-11-03', mood: 'sad', emotions: ['anger'], reflection: 'b' }),
        buildEntry({ date: '2026-11-01', mood: 'happy', achievement: 'a' }),
      ],
      new Date('2026-11-22T10:00:00Z'),
    )
    expect(backup).toEqual({
      format: 'florecer-journal',
      schemaVersion: 1,
      exportedAt: '2026-11-22T10:00:00.000Z',
      entries: [
        { date: '2026-11-01', mood: 'happy', emotions: [], reflection: '', achievement: 'a' },
        { date: '2026-11-03', mood: 'sad', emotions: ['anger'], reflection: 'b', achievement: '' },
      ],
    })
    const text = JSON.stringify(backup)
    for (const field of ['userId', 'user_id', 'id"', 'createdAt', 'updatedAt']) expect(text).not.toContain(field)
    expect(backupFileName('2026-11-22')).toBe('florecer-backup-2026-11-22.json')
  })

  it('ida y vuelta: lo exportado se reimporta completo en una cuenta vacía', () => {
    const entries = [buildEntry({ date: '2026-11-01', mood: 'happy', emotions: ['love'], reflection: 'línea 1\nlínea 2' })]
    const text = JSON.stringify(buildBackup(entries))
    const parsed = parseBackupText(text, text.length)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const preview = previewImport(parsed.entries, new Set(), TODAY)
    expect(preview.toImport).toEqual([{ date: '2026-11-01', mood: 'happy', emotions: ['love'], reflection: 'línea 1\nlínea 2', achievement: '' }])
  })
})

describe('parseBackupText', () => {
  it('rechaza archivos grandes, JSON roto, otro formato u otra versión', () => {
    expect(parseBackupText('{}', MAX_BACKUP_BYTES + 1)).toMatchObject({ ok: false, message: expect.stringMatching(/5 MB/) })
    expect(parseBackupText('{no', 3)).toMatchObject({ ok: false, message: expect.stringMatching(/JSON/) })
    expect(parseBackupText('{"format":"otro","schemaVersion":1,"entries":[]}', 50).ok).toBe(false)
    expect(parseBackupText('{"format":"florecer-journal","schemaVersion":2,"entries":[]}', 50).ok).toBe(false)
  })
})

describe('previewImport', () => {
  const raw = [
    { date: '2026-11-01', mood: 'happy', reflection: 'nuevo' },
    { date: '2026-11-02', mood: 'sad', emotions: ['anger'] },
    { date: '2026-11-02', mood: 'happy' }, // repetida en el archivo
    { date: '2026-11-05', mood: 'neutral' }, // ya existe en la cuenta
    { date: '2026-11-30', mood: 'happy' }, // futura
    { date: '2026-02-30', mood: 'happy' }, // no existe
    { date: '2026-11-06', mood: 'feliz' },
    { date: '2026-11-07', mood: 'happy', emotions: ['anger'] }, // emoción de otro grupo
    { date: '2026-11-08', mood: 'happy', reflection: 'x'.repeat(5001) },
    { mood: 'happy' },
    'texto suelto',
  ]

  it('clasifica nuevas, existentes, repetidas e inválidas sin exponer el contenido', () => {
    const preview = previewImport(raw, new Set(['2026-11-05']), TODAY)
    expect(preview.toImport.map((e) => e.date)).toEqual(['2026-11-01', '2026-11-02'])
    expect(preview.toImport[1]).toMatchObject({ emotions: ['anger'], reflection: '', achievement: '' })
    expect(preview.existing).toEqual(['2026-11-05'])
    expect(preview.duplicatedInFile).toEqual(['2026-11-02'])
    expect(preview.invalid.map((i) => [i.position, i.reason])).toEqual([
      [5, 'Fecha no válida o futura.'],
      [6, 'Fecha no válida o futura.'],
      [7, 'Estado de ánimo no válido.'],
      [8, 'Emociones no válidas para ese estado de ánimo.'],
      [9, 'La reflexión supera los 5000 caracteres o no es texto.'],
      [10, 'La entrada no tiene fecha.'],
      [11, 'La entrada no tiene fecha.'],
    ])
    expect(JSON.stringify(preview.invalid)).not.toContain('xxxx')
  })

  it('importar el mismo archivo dos veces no duplica: la segunda vez todo se omite', () => {
    const first = previewImport(raw, new Set(), TODAY)
    const second = previewImport(raw, new Set(first.toImport.map((e) => e.date)), TODAY)
    expect(second.toImport).toEqual([])
    expect(second.existing).toEqual(['2026-11-01', '2026-11-02', '2026-11-05'])
  })
})
