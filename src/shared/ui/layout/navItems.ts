import type { ComponentType } from 'react'
import { CalendarIcon, SettingsIcon, TodayIcon } from '../icons.tsx'

export interface NavItem {
  to: string
  label: string
  Icon: ComponentType<{ size?: number }>
}

/** Fase 1: Hoy, Calendario y Ajustes. Evolución se añade en fase 2. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/hoy', label: 'Hoy', Icon: TodayIcon },
  { to: '/calendario', label: 'Calendario', Icon: CalendarIcon },
  { to: '/ajustes', label: 'Ajustes', Icon: SettingsIcon },
]
