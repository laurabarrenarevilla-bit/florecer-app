import { z } from 'zod'

/**
 * Contrato de la respuesta de POST /api/ai/analyze (docs/08 y 17). Duplica a
 * propósito el esquema del servidor (api/ai/analyze.ts): la función se
 * despliega aislada y el navegador vuelve a validar lo que recibe.
 */
const item = z.string().trim().min(1).max(400)

export const analysisSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  recurringThemes: z.array(item).max(5),
  achievements: z.array(item).max(5),
  reflectionQuestions: z.array(item).max(5),
  suggestedActions: z.array(item).max(5),
  disclaimer: z.string().trim().min(1).max(400),
})

export type Analysis = z.infer<typeof analysisSchema>

export const analyzeSuccessSchema = z.object({
  data: analysisSchema,
  meta: z.object({ entryCount: z.number().int().nonnegative() }),
})

export const analyzeErrorSchema = z.object({
  error: z.object({ code: z.string().max(64), message: z.string().max(300) }),
})
