import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '@/shared/lib/errors.ts'
import { PartialImportError } from '@/features/journal/journalRepository.ts'
import { createFakeAuth, renderWithProviders, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { BackupSection } from './BackupSection.tsx'

function setup(existing = [buildEntry({ date: '2026-11-05', mood: 'neutral', reflection: 'original' })]) {
  const fake = createFakeJournalRepository(existing)
  const user = userEvent.setup()
  renderWithProviders(<BackupSection />, {
    auth: createFakeAuth({ status: 'authenticated', user: TEST_USER }),
    journalRepository: fake.repository,
  })
  return { ...fake, user }
}

function backupFile(entries: unknown[], name = 'florecer-backup-2026-11-22.json') {
  return new File([JSON.stringify({ format: 'florecer-journal', schemaVersion: 1, exportedAt: 'x', entries })], name, {
    type: 'application/json',
  })
}

const fileInput = () => screen.getByLabelText('Archivo de copia de Florecer')

afterEach(() => vi.restoreAllMocks())

describe('BackupSection', () => {
  it('exportar descarga un JSON con todas las entradas leídas en ese momento', async () => {
    const { user, repository } = setup()
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:florecer')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await user.click(screen.getByRole('button', { name: 'Descargar copia' }))
    expect(await screen.findByText('Copia descargada con 1 entrada.')).toBeInTheDocument()
    expect(repository.listAll).toHaveBeenCalled()
    expect(click).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0]?.[0]
    const json = JSON.parse(await blob!.text()) as { entries: unknown[] }
    expect(json.entries).toEqual([{ date: '2026-11-05', mood: 'neutral', emotions: [], reflection: 'original', achievement: '' }])
  })

  it('importar: vista previa, omite lo existente sin sobrescribir y verifica tras guardar', async () => {
    const { user, repository, rows } = setup()
    await user.upload(
      fileInput(),
      backupFile([
        { date: '2026-11-01', mood: 'happy', reflection: 'importada' },
        { date: '2026-11-05', mood: 'sad', reflection: 'no debe sobrescribir' },
        { date: '2099-01-01', mood: 'happy' },
      ]),
    )
    const preview = await screen.findByRole('region', { name: 'Vista previa de la importación' })
    expect(preview).toHaveTextContent('1 entrada nueva se añadirá')
    expect(preview).toHaveTextContent('1 se omitirá porque ese día ya tiene registro')
    expect(preview).toHaveTextContent('1 no es válida')
    expect(repository.insertMissing).not.toHaveBeenCalled()

    await user.click(within(preview).getByRole('button', { name: 'Importar 1 entrada' }))
    expect(await screen.findByText(/Importación completada: 1 entrada añadida y 1 omitida/)).toBeInTheDocument()
    expect(repository.insertMissing).toHaveBeenCalledWith([{ date: '2026-11-01', mood: 'happy', emotions: [], reflection: 'importada', achievement: '' }])
    expect(rows.get('2026-11-05')?.reflection).toBe('original')
  })

  it('cancelar la vista previa no importa nada', async () => {
    const { user, repository } = setup()
    await user.upload(fileInput(), backupFile([{ date: '2026-11-01', mood: 'happy' }]))
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(repository.insertMissing).not.toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: 'Vista previa de la importación' })).not.toBeInTheDocument()
  })

  it('rechaza un archivo que no es una copia de Florecer', async () => {
    const { user } = setup()
    await user.upload(fileInput(), new File(['{"hola":1}'], 'otro.json', { type: 'application/json' }))
    expect(await screen.findByText(/no es una copia de Florecer compatible/)).toBeInTheDocument()
  })

  it('un fallo a mitad informa de lo guardado y no anuncia éxito', async () => {
    const { user, repository } = setup([])
    repository.insertMissing.mockRejectedValueOnce(new PartialImportError(new AppError('NETWORK_UNAVAILABLE'), ['2026-11-01']))
    await user.upload(fileInput(), backupFile([{ date: '2026-11-01', mood: 'happy' }, { date: '2026-11-02', mood: 'happy' }]))
    await user.click(await screen.findByRole('button', { name: 'Importar 2 entradas' }))
    expect(await screen.findByText(/La importación no se ha completado/)).toHaveTextContent('Se guardaron 1 entrada antes del error')
    expect(screen.queryByText(/Importación completada/)).not.toBeInTheDocument()
  })
})
