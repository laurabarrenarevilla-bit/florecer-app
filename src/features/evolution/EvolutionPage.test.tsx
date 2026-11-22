import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { addCalendarDays, todayLocal } from '@/shared/lib/dates.ts'
import { createFakeAuth, renderWithProviders, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { EvolutionPage } from './EvolutionPage.tsx'
import { periodContaining, shiftPeriod } from './periods.ts'

const today = todayLocal()
const auth = () => createFakeAuth({ status: 'authenticated', user: TEST_USER })

function setup(entries: JournalEntry[], path = '/evolucion') {
  const fake = createFakeJournalRepository(entries)
  const user = userEvent.setup()
  renderWithProviders(<EvolutionPage />, { auth: auth(), path, journalRepository: fake.repository })
  return { ...fake, user }
}

const legend = () => screen.getByRole('list', { name: 'Días por ánimo' })
const legendRow = (label: string) =>
  within(legend())
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes(label))

describe('EvolutionPage', () => {
  it('sin registros muestra el estado vacío, sin gráficos ficticios', async () => {
    setup([])
    expect(await screen.findByText('Aún no hay registros en este período')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('calcula el mes actual a partir de las entradas reales y consulta solo hasta hoy', async () => {
    const { repository } = setup([
      buildEntry({ date: today, mood: 'happy', emotions: ['love'], achievement: 'logro sintético' }),
    ])
    await screen.findByRole('heading', { name: 'Cómo te has sentido' })
    const month = periodContaining('month', today)
    expect(repository.listBetween).toHaveBeenCalledWith(month.from, today)
    expect(legendRow('Feliz')).toHaveTextContent('1 día · 100 %')
    expect(legendRow('Triste')).toHaveTextContent('0 días')
    expect(screen.getByText('Amor')).toBeInTheDocument()
    expect(screen.getByText('logro sintético')).toBeInTheDocument()
    // Con 1 día no hay patrones.
    expect(screen.getByText(/aún hay pocos registros para ver patrones/i)).toBeInTheDocument()
  })

  it('cambia a semana y año manteniendo la URL coherente, y no deja ir al futuro', async () => {
    const { user, repository } = setup([buildEntry({ date: today, mood: 'sad' })])
    await screen.findByRole('heading', { name: 'Cómo te has sentido' })
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Semana' }))
    expect(screen.getByRole('button', { name: 'Semana' })).toHaveAttribute('aria-pressed', 'true')
    expect(repository.listBetween).toHaveBeenCalledWith(periodContaining('week', today).from, today)

    await user.click(screen.getByRole('button', { name: 'Año' }))
    expect(await screen.findByText(today.slice(0, 4), { selector: '.evolution__period' })).toBeInTheDocument()
  })

  it('el período anterior se compara sin valoraciones', async () => {
    const previous = shiftPeriod(periodContaining('month', today), -1)
    setup([
      buildEntry({ date: today, mood: 'happy' }),
      buildEntry({ id: '00000000-0000-4000-8000-0000000000bb', date: previous.from, mood: 'sad' }),
    ])
    const table = await screen.findByRole('table')
    const sadRow = within(table).getByRole('row', { name: /Triste/ })
    expect(within(sadRow).getAllByRole('cell').map((c) => c.textContent)).toEqual(['0 · 0 %', '1 · 100 %'])
    expect(table.textContent?.toLowerCase()).not.toMatch(/mejor|peor/)
  })

  it('al ir a un mes pasado aparece "Volver" y la franja marca los días sin registro', async () => {
    const { user } = setup([buildEntry({ date: addCalendarDays(today, -40), mood: 'neutral' })])
    await screen.findByText('Aún no hay registros en este período').catch(() => undefined)
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByRole('button', { name: /volver a este mes/i })).toBeInTheDocument()
  })
})
