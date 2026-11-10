import { useEffect, useState } from 'react'
import { msUntilNextLocalMidnight, todayLocal, type LocalDate } from './dates.ts'

/**
 * Fecha local de hoy que se actualiza al pasar la medianoche y al volver a la
 * pestaña (los temporizadores se congelan con el dispositivo en reposo).
 */
export function useToday(): LocalDate {
  const [today, setToday] = useState<LocalDate>(() => todayLocal())

  useEffect(() => {
    const refresh = () => setToday(todayLocal())
    let timer = window.setTimeout(function tick() {
      refresh()
      timer = window.setTimeout(tick, msUntilNextLocalMidnight() + 1000)
    }, msUntilNextLocalMidnight() + 1000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return today
}
