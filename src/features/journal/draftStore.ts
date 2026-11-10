import type { LocalDate } from '@/shared/lib/dates.ts'
import type { Mood } from './mood.ts'

/**
 * Borradores sin guardar, SOLO en memoria de la pestaña.
 *
 * Permiten recuperar lo escrito si la sesión caduca (redirección a /login y
 * vuelta) o si se cambia de pantalla sin guardar. No se usa localStorage ni
 * ningún otro almacenamiento persistente: al cerrar o recargar la pestaña,
 * o al cerrar sesión, desaparecen.
 */
export interface JournalDraft {
  mood: Mood | null
  reflection: string
  achievement: string
}

const drafts = new Map<string, JournalDraft>()

export function draftKey(userId: string, date: LocalDate): string {
  return `${userId}:${date}`
}

export function readDraft(key: string): JournalDraft | null {
  return drafts.get(key) ?? null
}

export function hasDraft(key: string): boolean {
  return drafts.has(key)
}

export function saveDraft(key: string, draft: JournalDraft): void {
  drafts.set(key, { ...draft })
}

export function clearDraft(key: string): void {
  drafts.delete(key)
}

/** Al cerrar sesión: no debe quedar texto de nadie en memoria. */
export function clearAllDrafts(): void {
  drafts.clear()
}

/** Al entrar otra cuenta en la misma pestaña: se descartan los borradores ajenos. */
export function clearDraftsExcept(userId: string): void {
  for (const key of drafts.keys()) {
    if (!key.startsWith(`${userId}:`)) drafts.delete(key)
  }
}
