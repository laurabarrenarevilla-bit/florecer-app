import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '@/app/queryClient.ts'
import { clearAllDrafts, saveDraft } from '@/features/journal/draftStore.ts'
import { PwaStatus } from './PwaStatus.tsx'
import { activatePwaUpdate } from './registration.ts'

vi.mock('./registration.ts', () => ({
  hasPwaUpdate: () => true,
  subscribeToPwaUpdate: () => () => {},
  activatePwaUpdate: vi.fn().mockResolvedValue('other-windows'),
}))

function setup() {
  render(<QueryClientProvider client={createQueryClient()}><PwaStatus /></QueryClientProvider>)
}

describe('Actualizaciones PWA', () => {
  it('no activa ni recarga automáticamente, y permite aplazar', async () => {
    setup()
    expect(activatePwaUpdate).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Más tarde' }))
    expect(screen.queryByText('Hay una nueva versión de Florecer.')).not.toBeInTheDocument()
    expect(activatePwaUpdate).not.toHaveBeenCalled()
  })

  it('bloquea borradores de cualquier pantalla y se desbloquea al guardarlos o descartarlos', () => {
    saveDraft('test-user:2026-01-01', { mood: 'happy', reflection: '', achievement: '' })
    setup()
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled()
    act(clearAllDrafts)
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeEnabled()
  })

  it('impide la actualización durante operaciones fuera de React Query', async () => {
    setup()
    const form = document.createElement('form')
    form.setAttribute('aria-busy', 'true')
    document.body.append(form)
    try {
      await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('espera a que termine la operación')
      expect(activatePwaUpdate).not.toHaveBeenCalled()
    } finally { form.remove() }
  })

  it('explica que hay que cerrar otras ventanas sin recargar', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Cierra las otras ventanas')
  })

  it('avisa de la pérdida de conexión y retira el aviso al recuperarla', () => {
    setup()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(screen.getByText(/Parece que no hay conexión/)).toBeInTheDocument()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(screen.queryByText(/Parece que no hay conexión/)).not.toBeInTheDocument()
  })
})
