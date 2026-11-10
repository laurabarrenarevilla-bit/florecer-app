import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { todayLocal } from '@/shared/lib/dates.ts'
import { AppError } from '@/shared/lib/errors.ts'
import { createFakeAuth, renderWithProviders, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import type { JournalEntry } from './types.ts'
import { TodayPage } from './TodayPage.tsx'

const auth = () => createFakeAuth({ status: 'authenticated', user: TEST_USER })

type FakeJournal = ReturnType<typeof createFakeJournalRepository>

function setup(initial: JournalEntry[] = [], configure?: (fake: FakeJournal) => void) {
  const fake = createFakeJournalRepository(initial)
  configure?.(fake)
  const user = userEvent.setup()
  const view = renderWithProviders(<TodayPage />, { auth: auth(), path: '/hoy', journalRepository: fake.repository })
  return { ...fake, user, view }
}

const saveButton = () => screen.getByRole('button', { name: /guardar mi día|guardar cambios|guardando/i })

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('TodayPage', () => {
  it('muestra la fecha de hoy y carga la entrada del día', async () => {
    const { repository } = setup()
    expect(await screen.findByRole('radio', { name: 'Feliz' })).toBeInTheDocument()
    expect(repository.getByDate).toHaveBeenCalledWith(todayLocal())
  })

  it('F1-01: sin emoción no se puede guardar ni se llama al backend', async () => {
    const { repository, user } = setup()
    await screen.findByRole('radio', { name: 'Feliz' })

    expect(saveButton()).toBeDisabled()
    expect(screen.getByText('Elige cómo te has sentido para poder guardar.')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/qué te gustaría recordar/i), 'texto de prueba')
    fireEvent.submit(saveButton().closest('form')!)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('F1-02/03: solo la emoción basta; tras confirmar el backend se muestra el resumen', async () => {
    const { repository, rows, user } = setup()
    await user.click(await screen.findByRole('radio', { name: 'Feliz' }))
    await user.click(saveButton())

    expect(repository.create).toHaveBeenCalledTimes(1)
    expect(repository.create).toHaveBeenCalledWith({ date: todayLocal(), mood: 'happy', reflection: '', achievement: '' })
    const summary = await screen.findByRole('article', { name: 'Tu registro de hoy' })
    expect(within(summary).getByText('Feliz')).toBeInTheDocument()
    expect(within(summary).getByText('Sin reflexión escrita.')).toBeInTheDocument()
    expect(await screen.findByText('Tu día se ha guardado.')).toBeInTheDocument()
    expect(rows.size).toBe(1)
    // Tras guardar se vuelve a leer del backend.
    expect(repository.getByDate.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('recorta espacios en los extremos y conserva los saltos de línea', async () => {
    const { repository, user } = setup()
    await user.click(await screen.findByRole('radio', { name: 'Normal' }))
    await user.type(screen.getByLabelText(/qué te gustaría recordar/i), '  línea uno{Enter}línea dos  ')
    await user.type(screen.getByLabelText(/pequeño logro/i), ' logro sintético ')
    await user.click(saveButton())

    expect(repository.create).toHaveBeenCalledWith({
      date: todayLocal(),
      mood: 'neutral',
      reflection: 'línea uno\nlínea dos',
      achievement: 'logro sintético',
    })
    const summary = await screen.findByRole('article', { name: 'Tu registro de hoy' })
    expect(within(summary).getByText(/logro sintético/)).toBeInTheDocument()
  })

  it('F1-12: un doble envío produce una sola escritura y ningún éxito anticipado', async () => {
    const { repository, user } = setup()
    const pending = deferred<JournalEntry>()
    repository.create.mockImplementationOnce(() => pending.promise)

    await user.click(await screen.findByRole('radio', { name: 'Feliz' }))
    const form = saveButton().closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    await user.click(saveButton())

    expect(repository.create).toHaveBeenCalledTimes(1)
    expect(saveButton()).toHaveAttribute('aria-busy', 'true')
    expect(saveButton()).toHaveTextContent('Guardando…')
    expect(screen.queryByText('Tu día se ha guardado.')).not.toBeInTheDocument()

    pending.resolve(buildEntry({ date: todayLocal(), mood: 'happy' }))
    expect(await screen.findByText('Tu día se ha guardado.')).toBeInTheDocument()
  })

  it('F1-13: si falla la red, avisa, conserva el borrador y permite reintentar', async () => {
    const { repository, user } = setup()
    repository.create.mockRejectedValueOnce(new AppError('NETWORK_UNAVAILABLE'))

    await user.click(await screen.findByRole('radio', { name: 'Triste' }))
    const reflection = screen.getByLabelText(/qué te gustaría recordar/i)
    await user.type(reflection, 'borrador sintético')
    await user.click(saveButton())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No hay conexión')
    expect(alert).toHaveTextContent('Lo que has escrito sigue aquí.')
    expect(alert).toHaveFocus()
    expect(reflection).toHaveValue('borrador sintético')
    expect(screen.getByRole('radio', { name: 'Triste' })).toBeChecked()
    expect(screen.queryByText('Tu día se ha guardado.')).not.toBeInTheDocument()

    await user.click(saveButton())
    expect(await screen.findByRole('article', { name: 'Tu registro de hoy' })).toBeInTheDocument()
    expect(repository.create).toHaveBeenCalledTimes(2)
  })

  it('F1-05: editar actualiza la misma entrada usando su updated_at', async () => {
    const existing = buildEntry({ date: todayLocal(), mood: 'happy', reflection: 'texto inicial' })
    const { repository, rows, user } = setup([existing])

    const summary = await screen.findByRole('article', { name: 'Tu registro de hoy' })
    expect(within(summary).getByText('texto inicial')).toBeInTheDocument()
    await user.click(within(summary).getByRole('button', { name: 'Editar' }))

    expect(screen.getByRole('radio', { name: 'Feliz' })).toBeChecked()
    expect(screen.getByLabelText(/qué te gustaría recordar/i)).toHaveValue('texto inicial')
    await user.click(screen.getByRole('radio', { name: 'Triste' }))
    await user.click(saveButton())

    expect(repository.update).toHaveBeenCalledWith({
      date: todayLocal(),
      mood: 'sad',
      reflection: 'texto inicial',
      achievement: '',
      expectedUpdatedAt: existing.updatedAt,
    })
    expect(repository.create).not.toHaveBeenCalled()
    const updated = await screen.findByRole('article', { name: 'Tu registro de hoy' })
    expect(within(updated).getByText('Triste')).toBeInTheDocument()
    expect(rows.size).toBe(1)
  })

  it('cancelar la edición descarta los cambios y vuelve al dato guardado', async () => {
    const { repository, user } = setup([buildEntry({ date: todayLocal(), mood: 'happy', reflection: 'texto inicial' })])

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const reflection = screen.getByLabelText(/qué te gustaría recordar/i)
    await user.clear(reflection)
    await user.type(reflection, 'cambio descartado')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    const summary = screen.getByRole('article', { name: 'Tu registro de hoy' })
    expect(within(summary).getByText('texto inicial')).toBeInTheDocument()
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('si el día se guardó en otra pestaña, avisa, recarga y conserva el borrador para guardarlo encima', async () => {
    const { repository, rows, user } = setup()
    await user.click(await screen.findByRole('radio', { name: 'Feliz' }))
    await user.type(screen.getByLabelText(/qué te gustaría recordar/i), 'borrador local')

    // Otra pestaña guarda el mismo día entre medias.
    const other = buildEntry({ date: todayLocal(), mood: 'sad', updatedAt: '2026-01-01T09:00:00.000000+00:00' })
    rows.set(other.date, other)
    await user.click(saveButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('ha cambiado en otra pestaña')
    expect(screen.getByLabelText(/qué te gustaría recordar/i)).toHaveValue('borrador local')
    expect(await screen.findByRole('button', { name: 'Guardar cambios' })).toBeEnabled()

    await user.click(saveButton())
    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({ expectedUpdatedAt: other.updatedAt, mood: 'happy' }))
    expect(await screen.findByRole('article', { name: 'Tu registro de hoy' })).toHaveTextContent('borrador local')
  })

  it('si no se puede cargar el día, muestra el error y permite reintentar', async () => {
    const { user } = setup([], ({ repository }) => {
      repository.getByDate.mockRejectedValueOnce(new AppError('DB_UNAVAILABLE'))
    })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No hemos podido cargar tu día.')
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('radio', { name: 'Feliz' })).toBeInTheDocument()
  })
})
