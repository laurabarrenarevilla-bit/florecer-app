/** Fecha civil (YYYY-MM-DD) en Europe/Madrid, la zona del navegador de las pruebas. */
export function madridDate(offsetDays = 0, now: Date = new Date()): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now)
  const [y, m, d] = today.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d + offsetDays))
  return date.toISOString().slice(0, 10)
}

/** "martes, 10 de noviembre": coincide con el inicio de la etiqueta de cada día. */
export function longDateEs(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
}
