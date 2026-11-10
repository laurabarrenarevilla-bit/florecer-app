import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { addCalendarDays, todayLocal } from '@/shared/lib/dates.ts'
import { axeViolations } from '@/test/axe.ts'
import { createFakeAuth, renderRoute, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { AppRoutes } from './router.tsx'

/** F1-18 (parte automática): axe-core sobre las pantallas compuestas reales. */
const signedIn = () => createFakeAuth({ status: 'authenticated', user: TEST_USER })
const yesterday = addCalendarDays(todayLocal(), -1)

async function renderAt(path: string, { authenticated = true, withEntries = false } = {}) {
  const journal = createFakeJournalRepository(
    withEntries ? [buildEntry({ date: todayLocal(), mood: 'happy', reflection: 'texto', achievement: 'logro' }), buildEntry({ date: yesterday, mood: 'sad' })] : [],
  )
  await renderRoute(<AppRoutes />, {
    path,
    auth: authenticated ? signedIn() : createFakeAuth(),
    journalRepository: journal.repository,
  })
}

describe('Accesibilidad (axe-core)', () => {
  it('iniciar sesión, incluidos los errores de validación', async () => {
    await renderAt('/login', { authenticated: false })
    expect(await axeViolations()).toEqual([])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await axeViolations()).toEqual([])
  })

  it('crear cuenta, incluidos los errores de validación', async () => {
    await renderAt('/registro', { authenticated: false })
    expect(await axeViolations()).toEqual([])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await axeViolations()).toEqual([])
  })

  it('Hoy con el formulario vacío', async () => {
    await renderAt('/hoy')
    await screen.findByRole('radio', { name: 'Feliz' })
    expect(await axeViolations()).toEqual([])
  })

  it('Hoy con el registro guardado', async () => {
    await renderAt('/hoy', { withEntries: true })
    await screen.findByRole('article', { name: 'Tu registro de hoy' })
    expect(await axeViolations()).toEqual([])
  })

  it('Calendario, detalle del día y confirmación de borrado', async () => {
    const user = userEvent.setup()
    await renderAt(`/calendario?dia=${yesterday}`, { withEntries: true })
    const dialog = await screen.findByRole('dialog')
    await within(dialog).findByRole('button', { name: 'Eliminar' })
    expect(await axeViolations()).toEqual([])

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    await screen.findByRole('alertdialog')
    expect(await axeViolations()).toEqual([])
  })

  it('Ajustes', async () => {
    await renderAt('/ajustes')
    expect(await axeViolations()).toEqual([])
  })

  it('página 404', async () => {
    await renderAt('/no-existe', { authenticated: false })
    expect(await axeViolations()).toEqual([])
  })
})
