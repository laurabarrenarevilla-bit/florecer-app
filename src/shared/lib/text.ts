/** "lunes, 9 de noviembre" → "Lunes, 9 de noviembre" */
export function capitalizeFirst(value: string): string {
  return value.charAt(0).toLocaleUpperCase('es-ES') + value.slice(1)
}

/** Saludo neutro según la hora local (sin nombre de la persona). */
export function greetingForHour(hour: number): string {
  if (hour >= 6 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
