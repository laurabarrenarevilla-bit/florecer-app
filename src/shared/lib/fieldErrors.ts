import type { z } from 'zod'

export type FieldErrors = Partial<Record<string, string>>

/** Primer mensaje de error por campo de un ZodError. */
export function firstFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key !== 'string') continue
    if (result[key] === undefined) result[key] = issue.message
  }
  return result
}
