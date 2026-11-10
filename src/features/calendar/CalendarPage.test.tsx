import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { JournalEntry } from '@/features/journal/types.ts'
import { addCalendarDays, addMonths, formatLongDate, monthKeyOf, todayLocal, type LocalDate } from '@/shared/lib/dates.ts'
import { AppError } from '@/shared/lib/errors.ts'
import { createFakeAuth, renderWithProviders, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { CalendarPage } from './CalendarPage.tsx'

const today = todayLocal()
const yesterday = addCalendarDays(today, -1)
const tomorrow = addCalendarDays(today, 1)

function setup(path: string, initial: JournalEntry[] = []) {
  const fake = createFakeJournalRepository(initial)
  const user = userEvent.setup()
  renderWithProviders(<CalendarPage />, {
    auth: createFakeAuth({ status: 'authenticated', user: TEST_USER }),
    path,
    journalRepository: fake.repository,
  })
  return { ...fake, user }
}

const dayButton = (date: LocalDate) => screen.getByRole('button', { name: new RegExp(`^${formatLongDate(date)},`) })
const findDialog = () => screen.findByRole('dialog')

describe('CalendarPage', () => {
  it('pinta el mes con lunes como primer día y colorea los días con registro', async () => {
    const { repository } = setup(`/calendario?mes=${monthKeyOf(yesterday)}`, [buildEntry({ date: yesterday, mood: 'happy' })])

    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]).toHaveTextContent('L')
    expect(within(headers[0]!).getByTitle('lunes')).toBeInTheDocument()
    await waitFor(() => expect(dayButton(yesterday)).toHaveAccessibleName(/Feliz$/))
    expect(dayButton(yesterday)).toHaveClass('day-cell--happy')
    expect(repository.listBetween).toHaveBeenCalledWith(`${monthKeyOf(yesterday)}-01`, expect.any(String))
    expect(screen.getByRole('list', { name: 'Leyenda de colores' })).toBeInTheDocument()
  })

  it('marca hoy con aria-current y deshabilita los días futuros del mes', async () => {
    setup('/calendario')
    await screen.findByRole('heading', { level: 2 })
    expect(dayButton(today)).toHaveAttribute('aria-current', 'date')
    if (monthKeyOf(tomorrow) === monthKeyOf(today)) expect(dayButton(tomorrow)).toBeDisabled()
  })

  it('F1-06: crea el registro de ayer desde el calendario', async () => {
    const { repository, user } = setup(`/calendario?mes=${monthKeyOf(yesterday)}`)
    await waitFor(() => expect(dayButton(yesterday)).toHaveAccessibleName(/sin registro$/))
    await user.click(dayButton(yesterday))

    const dialog = await findDialog()
    expect(within(dialog).getByText('No hay registro de este día.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Añadir registro de este día' }))
    await user.click(within(dialog).getByRole('radio', { name: 'Triste' }))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar registro' }))

    expect(repository.create).toHaveBeenCalledWith({ date: yesterday, mood: 'sad', reflection: '', achievement: '' })
    expect(await screen.findByText('Registro guardado.')).toBeInTheDocument()
    expect(within(dialog).getByRole('article', { name: 'Registro del día' })).toHaveTextContent('Triste')
    await waitFor(() => expect(dayButton(yesterday)).toHaveAccessibleName(/Triste$/))
  })

  it('F1-07: un día futuro abierto por URL no ofrece ninguna acción', async () => {
    const { repository } = setup(`/calendario?dia=${tomorrow}`)
    const dialog = await findDialog()
    expect(within(dialog).getByText(/todavía no ha llegado/)).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /añadir|guardar/i })).not.toBeInTheDocument()
    expect(repository.getByDate).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('edita un día pasado sin duplicarlo', async () => {
    const existing = buildEntry({ date: yesterday, mood: 'happy', reflection: 'texto inicial' })
    const { repository, rows, user } = setup(`/calendario?dia=${yesterday}`, [existing])

    const dialog = await findDialog()
    await user.click(await within(dialog).findByRole('button', { name: 'Editar' }))
    await user.click(within(dialog).getByRole('radio', { name: 'Normal' }))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({ date: yesterday, mood: 'neutral', expectedUpdatedAt: existing.updatedAt }))
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(rows.size).toBe(1)
  })

  it('F1-08: cancelar la eliminación conserva el registro; confirmar lo borra de verdad', async () => {
    const { repository, rows, user } = setup(`/calendario?dia=${yesterday}`, [buildEntry({ date: yesterday, mood: 'happy' })])

    const dialog = await findDialog()
    await user.click(await within(dialog).findByRole('button', { name: 'Eliminar' }))
    let confirm = await screen.findByRole('alertdialog')
    expect(confirm).toHaveTextContent('Esta acción no se puede deshacer.')
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    expect(repository.deleteByDate).not.toHaveBeenCalled()
    expect(rows.has(yesterday)).toBe(true)

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    confirm = await screen.findByRole('alertdialog')
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))

    expect(repository.deleteByDate).toHaveBeenCalledWith(yesterday)
    expect(await screen.findByText('Registro eliminado.')).toBeInTheDocument()
    expect(rows.has(yesterday)).toBe(false)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(dayButton(yesterday)).toHaveAccessibleName(/sin registro$/))
  })

  it('si falla el borrado, lo explica y no cierra la confirmación', async () => {
    const { repository, user } = setup(`/calendario?dia=${yesterday}`, [buildEntry({ date: yesterday })])
    repository.deleteByDate.mockRejectedValueOnce(new AppError('NETWORK_UNAVAILABLE'))

    const dialog = await findDialog()
    await user.click(await within(dialog).findByRole('button', { name: 'Eliminar' }))
    const confirm = await screen.findByRole('alertdialog')
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))

    expect(await within(confirm).findByRole('alert')).toHaveTextContent('No hay conexión')
    expect(screen.queryByText('Registro eliminado.')).not.toBeInTheDocument()
  })

  it('F1-09: navega entre meses y años sin pasar del mes actual', async () => {
    const { user } = setup('/calendario?mes=2026-01')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('enero de 2026')

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('diciembre de 2025')
    // 1 de diciembre de 2025 es lunes: ocupa la primera columna.
    const firstRow = screen.getAllByRole('row')[1]!
    expect(within(firstRow).getAllByRole('cell')[0]).toContainElement(dayButton('2025-12-01'))

    await user.click(screen.getByRole('button', { name: 'Volver al mes actual' }))
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
  })

  it('un mes futuro en la URL se limita al mes actual', () => {
    setup(`/calendario?mes=${addMonths(monthKeyOf(today), 2)}`)
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
    expect(dayButton(today)).toBeInTheDocument()
  })

  it('muestra un estado vacío cuando el mes no tiene registros', async () => {
    setup('/calendario')
    expect(await screen.findByText('Aún no hay registros en este mes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar hoy' })).toHaveAttribute('href', '/hoy')
  })
})
