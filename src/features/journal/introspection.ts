/**
 * Preguntas de introspección (ADR-011 §3). Lista fija: sin IA ni datos de la
 * persona. Ninguna presupone cómo se siente ni tiene tono clínico. No se
 * guardan: solo sirven de punto de partida para la reflexión.
 */
export const INTROSPECTION_PROMPTS = [
  '¿Qué te ha dado energía hoy?',
  '¿Qué te ha quitado energía hoy?',
  '¿Qué momento del día te gustaría recordar?',
  '¿Ha pasado algo que no esperabas?',
  '¿Con quién has compartido tiempo y cómo te has sentido?',
  '¿Qué necesitabas hoy? ¿Lo has tenido?',
  '¿Qué te ha preocupado y qué está en tu mano?',
  '¿Qué has hecho hoy por ti?',
  '¿Qué te gustaría hacer diferente mañana?',
  '¿Qué agradeces de hoy, aunque sea pequeño?',
  '¿Qué pensamiento se te ha repetido hoy?',
  '¿En qué parte del cuerpo has notado lo que sentías?',
  '¿Qué te ha hecho sonreír?',
  '¿Qué has aprendido hoy?',
  'Si hoy fuera una palabra, ¿cuál sería?',
] as const

/** Índice inicial estable para una misma entrada (no cambia al volver a pintar). */
export function initialPromptIndex(seed: string): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % INTROSPECTION_PROMPTS.length
}

export function nextPromptIndex(index: number): number {
  return (index + 1) % INTROSPECTION_PROMPTS.length
}
