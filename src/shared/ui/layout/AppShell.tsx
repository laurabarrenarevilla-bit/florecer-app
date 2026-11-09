import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Brand } from '../Brand.tsx'
import { NAV_ITEMS } from './navItems.ts'

interface AppShellProps {
  /** Contenido al pie de la barra lateral (p. ej. cuenta y cerrar sesión). */
  sidebarFooter?: ReactNode
}

export function AppShell({ sidebarFooter }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <aside className="sidebar">
        <div className="sidebar__brand">
          <Brand />
        </div>
        <nav aria-label="Principal">
          <ul className="sidebar__list" role="list">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink to={to} className="sidebar__link">
                  <Icon size={19} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {sidebarFooter && <div className="sidebar__footer">{sidebarFooter}</div>}
      </aside>

      <div className="app-shell__column">
        <header className="app-header">
          <Brand />
        </header>

        <main id="contenido" className="app-shell__content" tabIndex={-1}>
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Principal">
          <ul className="bottom-nav__list" role="list">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink to={to} className="bottom-nav__link">
                  <Icon size={21} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
