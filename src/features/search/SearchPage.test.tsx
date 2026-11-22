import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, renderWithProviders, TEST_USER } from '@/test/fakeAuth.tsx'
import { buildEntry, createFakeJournalRepository } from '@/test/fakeJournalRepository.ts'
import { SearchPage } from './SearchPage.tsx'

const entries = [
  buildEntry({ id: '00000000-0000-4000-8000-000000000001', date: '2026-11-01', mood: 'happy', reflection: 'Paseo por el río.' }),
  buildEntry({ id: '00000000-0000-4000-8000-000000000002', date: '2026-11-05', mood: 'sad', achievement: 'Terminé el examen' }),
]

function setup(path = '/buscar', data = entries) {
  const fake = createFakeJournalRepository(data)
  const user = userEvent.setup()
  renderWithProviders(<SearchPage />, {
    auth: createFakeAuth({ status: 'authenticated', user: TEST_USER }),
    path,
    journalRepository: fake.repository,
  })
  return { ...fake, user }
}

const results = () => within(screen.getByRole('list')).getAllByRole('link')

describe('SearchPage', () => {
  it('lista todo y filtra al escribir, sin distinguir tildes', async () => {
    const { user } = setup()
    expect(await screen.findByText(/2 días registrados/)).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Palabras' }), 'rio')
    expect(screen.getByText('1 día coincide')).toBeInTheDocument()
    expect(results()).toHaveLength(1)
    expect(results()[0]).toHaveAttribute('href', '/calendario?mes=2026-11&dia=2026-11-01')
  })

  it('lee los filtros de la URL y filtra por ánimo', async () => {
    setup('/buscar?animo=sad')
    await screen.findByText('1 día coincide')
    expect(screen.getByRole('combobox', { name: 'Ánimo' })).toHaveValue('sad')
    expect(results()[0]).toHaveTextContent('Terminé el examen')
  })

  it('sin coincidencias lo dice y permite quitar filtros', async () => {
    const { user } = setup('/buscar?q=inexistente')
    expect(await screen.findByText('No hay días que coincidan')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(await screen.findByText(/2 días registrados/)).toBeInTheDocument()
  })

  it('sin registros muestra el estado vacío', async () => {
    setup('/buscar', [])
    expect(await screen.findByText('Aún no tienes registros')).toBeInTheDocument()
  })
})
