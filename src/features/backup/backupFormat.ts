import { z } from 'zod'
import { entryContentSchema, notFutureDateSchema } from '@/features/journal/schema.ts'
import type { CreateJournalEntryInput, JournalEntry } from '@/features/journal/types.ts'
import { compareLocalDates, todayLocal, type LocalDate } from '@/shared/lib/dates.ts'

/**
 * Formato de copia de seguridad v1 (docs/12). Sin user_id, email, tokens ni
 * metadatos internos: solo lo que la persona escribió. `emotions` es opcional
 * al importar para aceptar copias anteriores a ADR-011.
 */
export const BACKUP_FORMAT = 'florecer-journal'
export const BACKUP_SCHEMA_VERSION = 1
/** Límite revisable del archivo a importar (docs/12). */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024
/** Más que suficiente para décadas de diario (una entrada por día). */
export const MAX_BACKUP_ENTRIES = 20_000

export interface BackupEntry {
  date: LocalDate
  mood: JournalEntry['mood']
  emotions: JournalEntry['emotions']
  reflection: string
  achievement: string
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  entries: BackupEntry[]
}

export function buildBackup(entries: readonly JournalEntry[], now: Date = new Date()): BackupFile {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    entries: [...entries]
      .sort((a, b) => compareLocalDates(a.date, b.date))
      .map(({ date, mood, emotions, reflection, achievement }) => ({ date, mood, emotions, reflection, achievement })),
  }
}

export function backupFileName(today: LocalDate = todayLocal()): string {
  return `florecer-backup-${today}.json`
}

// --- Importación ---------------------------------------------------------------

const envelopeSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().optional(),
  entries: z.array(z.unknown()).max(MAX_BACKUP_ENTRIES),
})

export interface InvalidBackupEntry {
  /** Posición en el archivo (1, 2, 3…). Nunca se muestra el contenido. */
  position: number
  date: string | null
  reason: string
}

export interface ImportPreview {
  /** Válidas y sin fecha repetida en la cuenta: se importarán. */
  toImport: CreateJournalEntryInput[]
  /** Válidas pero su fecha ya existe en la cuenta: se omitirán. */
  existing: LocalDate[]
  /** Fechas repetidas dentro del propio archivo (se usa la primera). */
  duplicatedInFile: LocalDate[]
  invalid: InvalidBackupEntry[]
}

export type ParseResult = { ok: true; entries: unknown[] } | { ok: false; message: string }

/** Comprueba tamaño, JSON y envoltorio del archivo. No mira el contenido de las entradas. */
export function parseBackupText(text: string, sizeBytes: number): ParseResult {
  if (sizeBytes > MAX_BACKUP_BYTES) return { ok: false, message: 'El archivo es demasiado grande (máximo 5 MB).' }
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, message: 'El archivo no es un JSON válido.' }
  }
  const envelope = envelopeSchema.safeParse(json)
  if (!envelope.success) {
    return { ok: false, message: 'El archivo no es una copia de Florecer compatible (formato o versión desconocidos).' }
  }
  return { ok: true, entries: envelope.data.entries }
}

const rawEntrySchema = z.object({
  date: z.string(),
  mood: z.unknown(),
  emotions: z.unknown().optional(),
  reflection: z.unknown().optional(),
  achievement: z.unknown().optional(),
})

function reasonFor(issues: readonly z.core.$ZodIssue[]): string {
  const field = String(issues[0]?.path[0] ?? '')
  if (field === 'mood') return 'Estado de ánimo no válido.'
  if (field === 'emotions') return 'Emociones no válidas para ese estado de ánimo.'
  if (field === 'reflection') return 'La reflexión supera los 5000 caracteres o no es texto.'
  if (field === 'achievement') return 'El logro supera los 500 caracteres o no es texto.'
  return 'Datos no válidos.'
}

/**
 * Valida cada entrada con las mismas reglas que el formulario y la base de
 * datos, y la clasifica frente a las fechas que ya tiene la cuenta.
 */
export function previewImport(rawEntries: readonly unknown[], existingDates: ReadonlySet<LocalDate>, today = todayLocal()): ImportPreview {
  const preview: ImportPreview = { toImport: [], existing: [], duplicatedInFile: [], invalid: [] }
  const seen = new Set<LocalDate>()
  const dateSchema = notFutureDateSchema(today)

  rawEntries.forEach((raw, index) => {
    const position = index + 1
    const base = rawEntrySchema.safeParse(raw)
    if (!base.success) {
      preview.invalid.push({ position, date: null, reason: 'La entrada no tiene fecha.' })
      return
    }
    const date = dateSchema.safeParse(base.data.date)
    if (!date.success) {
      preview.invalid.push({ position, date: base.data.date.slice(0, 10), reason: 'Fecha no válida o futura.' })
      return
    }
    const content = entryContentSchema.safeParse({
      mood: base.data.mood,
      emotions: base.data.emotions ?? [],
      reflection: base.data.reflection ?? '',
      achievement: base.data.achievement ?? '',
    })
    if (!content.success) {
      preview.invalid.push({ position, date: date.data, reason: reasonFor(content.error.issues) })
      return
    }
    if (seen.has(date.data)) {
      preview.duplicatedInFile.push(date.data)
      return
    }
    seen.add(date.data)
    if (existingDates.has(date.data)) {
      preview.existing.push(date.data)
      return
    }
    preview.toImport.push({ date: date.data, ...content.data })
  })

  return preview
}
