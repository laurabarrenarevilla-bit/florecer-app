import type { ComponentType } from 'react'
import { CalendarIcon, EvolutionIcon, SettingsIcon, TodayIcon } from '../icons.tsx'

export interface NavItem {
  to: string
  label: string
  Icon: ComponentType<{ size?: number }>
}

/** Hoy, Calendario, Evolución (fase 2) y Ajustes. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/hoy', label: 'Hoy', Icon: TodayIcon },
  { to: '/calendario', label: 'Calendario', Icon: CalendarIcon },
  { to: '/evolucion', label: 'Evolución', Icon: EvolutionIcon },
  { to: '/ajustes', label: 'Ajustes', Icon: SettingsIcon },
]
