import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { JournalEntry } from '@/features/journal/types.ts'
import { addCalendarDays, todayLocal } from '@/shared/lib/dates.ts'
import { createFakeAuth, renderWithProviders, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { AiError, type AiClient } from './aiClient.ts'
import type { Analysis } from './schema.ts'
import { WeeklySummaryPage } from './WeeklySummaryPage.tsx'

const today = todayLocal()
const yesterday = addCalendarDays(today, -1)
const twoDaysAgo = addCalendarDays(today, -2)

const analysis: Analysis = {
  summary: 'Resumen sintético de la semana.',
  recurringThemes: ['Tema sintético'],
  achievements: [],
  reflectionQuestions: ['¿Pregunta sintética?'],
  suggestedActions: [],
  disclaimer: 'Reflexión orientativa, no evaluación profesional.',
}

const ENTRIES: JournalEntry[] = [
  buildEntry({ id: '00000000-0000-4000-8000-000000000001', date: today, mood: 'happy', emotions: ['love'], reflection: 'Reflexión sintética de hoy.' }),
  buildEntry({ id: '00000000-0000-4000-8000-000000000002', date: yesterday, mood: 'sad', achievement: 'Logro sintético' }),
  buildEntry({ id: '00000000-0000-4000-8000-000000000003', date: twoDaysAgo, mood: 'neutral' }),
]

function setup(entries: JournalEntry[] = ENTRIES, analyzeWeek = vi.fn<AiClient['analyzeWeek']>(async () => analysis)) {
  const fake = createFakeJournalRepository(entries)
  const user = userEvent.setup()
  renderWithProviders(<WeeklySummaryPage client={{ analyzeWeek }} />, {
    auth: createFakeAuth({ status: 'authenticated', user: TEST_USER }),
    path: '/evolucion/resumen',
    journalRepository: fake.repository,
  })
  return { ...fake, user, analyzeWeek }
}

describe('WeeklySummaryPage', () => {
  it('sin registros muestra el estado vacío', async () => {
    setup([])
    expect(await screen.findByText('Aún no hay registros en los últimos 7 días')).toBeInTheDocument()
  })

  it('muestra cifras calculadas por código y la vista previa íntegra', async () => {
    setup()
    const facts = await screen.findByRole('region', { name: 'Tu semana en cifras' })
    expect(facts).toHaveTextContent('3 de 7 días registrados')
    expect(facts).toHaveTextContent('1 día con logro')
    expect(screen.getByText('Reflexión sintética de hoy.')).toBeInTheDocument()
    expect(screen.getByText('Logro sintético')).toBeInTheDocument()
    expect(screen.getByText(/Emociones: Amor/)).toBeInTheDocument()
    // La entrada sin texto no se puede incluir.
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.filter((c) => (c as HTMLInputElement).checked)).toHaveLength(2)
    expect(checkboxes.filter((c) => (c as HTMLInputElement).disabled)).toHaveLength(1)
  })

  it('Copiar para ChatGPT copia solo lo seleccionado y no llama a la IA', async () => {
    const { user, analyzeWeek } = setup()
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await screen.findByText('Reflexión sintética de hoy.')
    await user.click(screen.getAllByRole('checkbox')[1]!) // quita la de ayer
    await user.click(screen.getByRole('button', { name: 'Copiar para ChatGPT' }))

    expect(await screen.findByText('Texto copiado. Puedes pegarlo en ChatGPT.')).toBeInTheDocument()
    const copied = String(writeText.mock.calls[0]?.at(0) ?? '')
    expect(copied).toContain('Reflexión sintética de hoy.')
    expect(copied).not.toContain('Logro sintético')
    expect(analyzeWeek).not.toHaveBeenCalled()
  })

  it('si el portapapeles falla, ofrece el texto para copiarlo a mano', async () => {
    const { user } = setup()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => Promise.reject(new Error('x'))) }, configurable: true })
    await screen.findByText('Reflexión sintética de hoy.')
    await user.click(screen.getByRole('button', { name: 'Copiar para ChatGPT' }))
    const manual = (await screen.findByLabelText(/selecciona el texto/i)) as HTMLTextAreaElement
    expect(manual.value).toContain('Reflexión sintética de hoy.')
  })

  it('cancelar la confirmación no envía nada', async () => {
    const { user, analyzeWeek } = setup()
    await screen.findByText('Reflexión sintética de hoy.')
    await user.click(screen.getByRole('button', { name: 'Enviar a NVIDIA…' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Se enviarán 2 entradas')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(analyzeWeek).not.toHaveBeenCalled()
  })

  it('confirmar envía solo ids y versiones de lo seleccionado y muestra el resultado validado', async () => {
    const { user, analyzeWeek } = setup()
    await screen.findByText('Reflexión sintética de hoy.')
    await user.click(screen.getAllByRole('checkbox')[1]!)
    await user.click(screen.getByRole('button', { name: 'Enviar a NVIDIA…' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Enviar' }))

    expect(analyzeWeek).toHaveBeenCalledWith([{ id: ENTRIES[0]!.id, updatedAt: ENTRIES[0]!.updatedAt }])
    const result = await screen.findByRole('region', { name: 'Tu resumen' })
    expect(result).toHaveTextContent('Resumen sintético de la semana.')
    expect(result).toHaveTextContent('¿Pregunta sintética?')
    expect(result).toHaveTextContent('Reflexión orientativa, no evaluación profesional.')
    expect(within(result).queryByText('Logros que mencionas')).not.toBeInTheDocument()

    // Cambiar la selección retira el resultado: correspondía a otra selección.
    await user.click(screen.getAllByRole('checkbox')[1]!)
    expect(screen.queryByRole('region', { name: 'Tu resumen' })).not.toBeInTheDocument()
  })

  it('sin nada seleccionado no se puede copiar ni enviar', async () => {
    const { user } = setup()
    await screen.findByText('Reflexión sintética de hoy.')
    for (const box of screen.getAllByRole('checkbox').filter((c) => !(c as HTMLInputElement).disabled)) await user.click(box)
    expect(screen.getByRole('button', { name: 'Copiar para ChatGPT' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar a NVIDIA…' })).toBeDisabled()
  })

  it('si las entradas cambiaron (PREVIEW_STALE) avisa y recarga la vista previa', async () => {
    const analyzeWeek = vi.fn<AiClient['analyzeWeek']>(async () => {
      throw new AiError('PREVIEW_STALE', 'Tus entradas han cambiado. Revísalas antes de enviarlas.')
    })
    const { user, repository } = setup(ENTRIES, analyzeWeek)
    await screen.findByText('Reflexión sintética de hoy.')
    const loads = repository.listBetween.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Enviar a NVIDIA…' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Tus entradas han cambiado. Revísalas antes de enviarlas.')).toBeInTheDocument()
    expect(repository.listBetween.mock.calls.length).toBeGreaterThan(loads)
    expect(screen.queryByRole('region', { name: 'Tu resumen' })).not.toBeInTheDocument()
  })
})
